import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
import { storage } from "../storage";
import { requestOtpSchema, verifyOtpSchema, insertCaServiceSchema, insertCrossSellOfferSchema } from "@shared/schema";
import { sendOtpEmail } from "../services/emailService";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getOtpExpiryDate,
  adminAuthMiddleware,
  checkOtpRateLimit,
  type AuthenticatedRequest,
} from "../services/adminAuth";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "dev-encryption-key-32chars-long!!";

function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSecret(encrypted: string): string {
  const [ivHex, data] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

const ADMIN_EMAIL = "hanvitt.advisors@gmail.com";

router.post("/auth/request-otp", authLimiter, async (req, res) => {
  try {
    const { email } = requestOtpSchema.parse(req.body);

    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return res.status(200).json({ message: "If the email is registered, you will receive an OTP." });
    }

    const admin = await storage.getAdminByEmail(email);
    if (!admin || !admin.isActive) {
      return res.status(200).json({ message: "If the email is registered, you will receive an OTP." });
    }

    if (!checkOtpRateLimit(email)) {
      return res.status(429).json({ message: "Too many OTP requests. Please wait before trying again." });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    await storage.createOtp(admin.id, otpHash, getOtpExpiryDate());

    try {
      await sendOtpEmail(email, otp);
    } catch {
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }

    res.status(200).json({ message: "If the email is registered, you will receive an OTP." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    console.error("OTP request error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.post("/auth/verify-otp", authLimiter, async (req, res) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const totpCode = req.body.totpCode as string | undefined;

    const admin = await storage.getAdminByEmail(email);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const latestOtp = await storage.getLatestOtp(admin.id);
    if (!latestOtp) {
      return res.status(401).json({ message: "No OTP found. Please request a new one." });
    }

    if (new Date() > latestOtp.expiresAt) {
      await storage.markOtpUsed(latestOtp.id);
      return res.status(401).json({ message: "OTP has expired. Please request a new one." });
    }

    const isValid = await verifyOtp(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

    if (admin.totpEnabled && admin.totpSecret) {
      if (!totpCode) {
        return res.status(200).json({ requireTotp: true, message: "Please enter your authenticator code." });
      }
      try {
        const secret = decryptSecret(admin.totpSecret);
        const totp = new OTPAuth.TOTP({
          issuer: "Hanvitt Advisors",
          label: admin.email,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });
        const delta = totp.validate({ token: totpCode, window: 1 });
        if (delta === null) {
          return res.status(401).json({ requireTotp: true, message: "Invalid authenticator code." });
        }
      } catch {
        return res.status(401).json({ requireTotp: true, message: "Invalid authenticator code." });
      }
    }

    await storage.markOtpUsed(latestOtp.id);

    const accessToken = generateAccessToken(admin.id, admin.email, admin.role);
    const refreshToken = generateRefreshToken(admin.id);

    await storage.createAuditLog(admin.id, "login", "admin_users", admin.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/admin/auth/refresh",
    });

    res.json({ accessToken, admin: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input." });
    }
    console.error("OTP verify error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.post("/auth/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token." });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken(payload.adminId, "", "admin");
    const newRefreshToken = generateRefreshToken(payload.adminId);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/admin/auth/refresh",
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Token refresh error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Something went wrong." });
  }
});

router.post("/auth/logout", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  if (req.admin) {
    await storage.createAuditLog(req.admin.adminId, "logout", "admin_users", req.admin.adminId);
  }
  res.clearCookie("refreshToken", { path: "/api/admin/auth/refresh" });
  res.json({ message: "Logged out." });
});

router.get("/auth/me", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.admin) return res.status(401).json({ message: "Not authenticated." });
  res.json({ admin: req.admin });
});

router.get("/services", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const services = await storage.getCaServices();
    res.json(services);
  } catch (err) {
    console.error("Get services error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch services." });
  }
});

router.post("/services", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const data = insertCaServiceSchema.parse(req.body);
    const serviceData = { ...data, priceMax: data.priceMax || null, frequency: data.frequency || null };
    const service = await storage.createCaService(serviceData as any);
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "create", "ca_services", service.id);
    }
    res.status(201).json(service);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid service data.", errors: err.errors });
    }
    console.error("Create service error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to create service." });
  }
});

router.put("/services/:id", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = insertCaServiceSchema.partial().parse(req.body);
    const serviceData = { ...data, priceMax: data.priceMax || null, frequency: data.frequency || null };
    const service = await storage.updateCaService(id, serviceData as any);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "update", "ca_services", id);
    }
    res.json(service);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid service data.", errors: err.errors });
    }
    console.error("Update service error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to update service." });
  }
});

router.delete("/services/:id", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const service = await storage.getCaServiceById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }
    const deactivatedCount = await storage.deactivateOffersByService(id, service.serviceName);
    const deleted = await storage.deleteCaService(id);
    if (!deleted) {
      return res.status(404).json({ message: "Service not found." });
    }
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "delete", "ca_services", id);
      if (deactivatedCount > 0) {
        await storage.createAuditLog(req.admin.adminId, "auto_deactivate", "cross_sell_offers", `${deactivatedCount} offers for service ${service.serviceName}`);
      }
    }
    res.json({ message: "Service deleted.", deactivatedOffers: deactivatedCount });
  } catch (err) {
    console.error("Delete service error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to delete service." });
  }
});

router.get("/offers", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const offers = await storage.getCrossSellOffers();
    res.json(offers);
  } catch (err) {
    console.error("Get offers error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch offers." });
  }
});

router.post("/offers", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const data = insertCrossSellOfferSchema.parse(req.body);
    const offer = await storage.createCrossSellOffer(data);
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "create", "cross_sell_offers", offer.id);
    }
    res.status(201).json(offer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid offer data.", errors: err.errors });
    }
    console.error("Create offer error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to create offer." });
  }
});

router.put("/offers/:id", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = insertCrossSellOfferSchema.partial().parse(req.body);
    const offer = await storage.updateCrossSellOffer(id, data);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "update", "cross_sell_offers", id);
    }
    res.json(offer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid offer data.", errors: err.errors });
    }
    console.error("Update offer error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to update offer." });
  }
});

router.delete("/offers/:id", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteCrossSellOffer(id);
    if (!deleted) {
      return res.status(404).json({ message: "Offer not found." });
    }
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "delete", "cross_sell_offers", id);
    }
    res.json({ message: "Offer deleted." });
  } catch (err) {
    console.error("Delete offer error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to delete offer." });
  }
});

router.get("/audit-logs", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const logs = await storage.getAuditLogs(limit);
    res.json(logs);
  } catch (err) {
    console.error("Get audit logs error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch audit logs." });
  }
});

router.post("/auth/totp/setup", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.admin) return res.status(401).json({ message: "Not authenticated." });
    const admin = await storage.getAdminById(req.admin.adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found." });
    if (admin.totpEnabled) return res.status(400).json({ message: "2FA is already enabled." });

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "Hanvitt Advisors",
      label: admin.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const otpauthUrl = totp.toString();
    const base32Secret = secret.base32;

    res.json({ otpauthUrl, secret: base32Secret });
  } catch (err) {
    console.error("TOTP setup error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to setup 2FA." });
  }
});

router.post("/auth/totp/verify-setup", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.admin) return res.status(401).json({ message: "Not authenticated." });
    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ message: "Secret and token required." });

    const totp = new OTPAuth.TOTP({
      issuer: "Hanvitt Advisors",
      label: req.admin.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      return res.status(400).json({ message: "Invalid code. Please try again." });
    }

    const encrypted = encryptSecret(secret);
    await storage.updateAdminTotp(req.admin.adminId, encrypted, true);
    await storage.createAuditLog(req.admin.adminId, "enable_2fa", "admin_users", req.admin.adminId);

    res.json({ message: "2FA enabled successfully." });
  } catch (err) {
    console.error("TOTP verify setup error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to verify 2FA setup." });
  }
});

router.post("/auth/totp/disable", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.admin) return res.status(401).json({ message: "Not authenticated." });
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Authenticator code required." });

    const admin = await storage.getAdminById(req.admin.adminId);
    if (!admin || !admin.totpEnabled || !admin.totpSecret) {
      return res.status(400).json({ message: "2FA is not enabled." });
    }

    const secret = decryptSecret(admin.totpSecret);
    const totp = new OTPAuth.TOTP({
      issuer: "Hanvitt Advisors",
      label: admin.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      return res.status(400).json({ message: "Invalid code." });
    }

    await storage.updateAdminTotp(req.admin.adminId, null, false);
    await storage.createAuditLog(req.admin.adminId, "disable_2fa", "admin_users", req.admin.adminId);

    res.json({ message: "2FA disabled successfully." });
  } catch (err) {
    console.error("TOTP disable error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to disable 2FA." });
  }
});

router.get("/auth/totp/status", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.admin) return res.status(401).json({ message: "Not authenticated." });
    const admin = await storage.getAdminById(req.admin.adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found." });
    res.json({ totpEnabled: admin.totpEnabled });
  } catch (err) {
    console.error("TOTP status error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to check 2FA status." });
  }
});

router.get("/security/logs", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const logs = await storage.getSecurityLogs(limit);
    res.json(logs);
  } catch (err) {
    console.error("Get security logs error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch security logs." });
  }
});

router.get("/security/stats", adminAuthMiddleware, async (_req, res) => {
  try {
    const stats = await storage.getSecurityStats();
    res.json(stats);
  } catch (err) {
    console.error("Get security stats error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch security stats." });
  }
});

router.get("/settings", adminAuthMiddleware, async (_req, res) => {
  try {
    const settings = await storage.getAllSettings();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    res.json(map);
  } catch (err) {
    console.error("Get settings error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to fetch settings." });
  }
});

router.put("/settings/:key", adminAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.params;
    const allowedKeys = ["ca_tax_enabled"];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ message: "Invalid setting key." });
    }
    const { value } = req.body;
    if (typeof value !== "string") {
      return res.status(400).json({ message: "Value must be a string." });
    }
    await storage.setSetting(key, value);
    if (req.admin) {
      await storage.createAuditLog(req.admin.adminId, "update", "site_settings", key);
    }
    res.json({ message: "Setting updated.", key, value });
  } catch (err) {
    console.error("Update setting error:", err instanceof Error ? err.message : "unknown");
    res.status(500).json({ message: "Failed to update setting." });
  }
});

export default router;
