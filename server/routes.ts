import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { calculateRetirement } from "./services/retirementEngine";
import { getAIRetirementAnalysis } from "./services/aiRetirementAdvisor";
import { verifyRecaptcha } from "./services/recaptchaService";
import { sendAdminNotification, sendCustomerThankYou } from "./services/emailService";
import { encryptIfAvailable } from "./services/encryption";
import { generateInsuranceGapPdf } from "./services/insuranceGapPdf";
import adminRoutes from "./routes/adminRoutes";

function sanitizeInput(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n]/g, " ")
    .trim();
}

const MALICIOUS_PATTERNS = [
  /DROP\s+TABLE/i,
  /SELECT\s+\*/i,
  /INSERT\s+INTO/i,
  /DELETE\s+FROM/i,
  /UNION\s+SELECT/i,
  /--\s/,
  /;\s*$/,
  /'\s*OR\s+\d+=\d+/i,
  /<script\b/i,
  /<\/script>/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
];

function containsMaliciousPattern(value: string): string | null {
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(value)) {
      return pattern.source;
    }
  }
  return null;
}

function hasEmailInjection(value: string): boolean {
  return /[\r\n]/.test(value) || /BCC:/i.test(value) || /CC:/i.test(value) || /Content-Type:/i.test(value);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const buildAllowedOrigins = (): string[] => {
    const origins: string[] = [];
    if (process.env.ALLOWED_ORIGINS) {
      origins.push(...process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()));
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach(d => {
        origins.push(`https://${d.trim()}`);
      });
    }
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.NODE_ENV !== "production") {
      origins.push("http://localhost:5000", "http://0.0.0.0:5000");
    }
    return origins;
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      const allowed = buildAllowedOrigins();
      if (allowed.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Max-Age", "86400");
      }
    }

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    res.setHeader("Vary", "Origin");

    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://www.gstatic.com",
      "connect-src 'self' https://www.google.com https://www.gstatic.com https://www.google.com/recaptcha/",
      "frame-src https://www.google.com https://www.gstatic.com https://www.google.com/recaptcha/",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join("; ");
    
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    res.removeHeader("X-Powered-By");

    if (req.path.startsWith("/api") && ["POST", "PUT", "PATCH"].includes(req.method)) {
      const ct = req.headers["content-type"] || "";
      if (!ct.includes("application/json")) {
        return res.status(415).json({ message: "Unsupported content type." });
      }
    }

    next();
  });

  app.use(cookieParser());

  app.use("/api/admin", adminRoutes);

  app.get("/api/public/settings", async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;
      res.json(map);
    } catch (err) {
      console.error("Public settings error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Failed to fetch settings." });
    }
  });

  app.get("/api/public/services", async (_req, res) => {
    try {
      const services = await storage.getCaServices(true);
      res.json(services);
    } catch (err) {
      console.error("Public services error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Failed to fetch services." });
    }
  });

  app.get("/api/public/offers", async (_req, res) => {
    try {
      const offers = await storage.getCrossSellOffers(true);
      res.json(offers);
    } catch (err) {
      console.error("Public offers error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Failed to fetch offers." });
    }
  });

  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again after 15 minutes." },
  });

  app.post(api.contact.create.path, contactLimiter, async (req, res) => {
    const clientIp = (req.ip || req.socket.remoteAddress || "unknown").substring(0, 50);

    try {
      if (req.body.website) {
        return res.status(200).json({ success: true, message: "Thank you for contacting Hanvitt Advisors." });
      }

      const body = req.body;
      const fieldsToCheck = [body.fullName, body.email, body.phone, body.city, body.message].filter(Boolean);
      for (const field of fieldsToCheck) {
        if (typeof field === "string") {
          const matched = containsMaliciousPattern(field);
          if (matched) {
            storage.logSecurityEvent(clientIp, `Malicious pattern: ${matched} in value: ${field.substring(0, 100)}`).catch(() => {});
            return res.status(400).json({ message: "Invalid input detected." });
          }
        }
      }

      if (body.email && typeof body.email === "string" && hasEmailInjection(body.email)) {
        storage.logSecurityEvent(clientIp, `Email injection attempt: ${body.email.substring(0, 100)}`).catch(() => {});
        return res.status(400).json({ message: "Invalid email format." });
      }
      if (body.fullName && typeof body.fullName === "string" && hasEmailInjection(body.fullName)) {
        storage.logSecurityEvent(clientIp, `Header injection in name: ${body.fullName.substring(0, 100)}`).catch(() => {});
        return res.status(400).json({ message: "Invalid name format." });
      }

      const raw = api.contact.create.input.parse(body);

      const isHuman = await verifyRecaptcha(raw.recaptcha_token);
      if (!isHuman) {
        storage.logSecurityEvent(clientIp, "reCAPTCHA verification failed").catch(() => {});
        return res.status(403).json({ message: "Verification failed. Please try again." });
      }

      const plainInput = {
        fullName: sanitizeInput(raw.fullName),
        email: sanitizeInput(raw.email),
        phone: raw.phone ? sanitizeInput(raw.phone) : undefined,
        city: raw.city ? sanitizeInput(raw.city) : undefined,
        interestType: raw.interestType,
        message: sanitizeInput(raw.message),
        consentGiven: raw.consentGiven,
        ipAddress: clientIp,
        userAgent: (req.headers["user-agent"] || "").substring(0, 500),
      };

      const timestamp = new Date().toISOString();
      sendAdminNotification({ ...plainInput, timestamp }).catch(() => {});
      sendCustomerThankYou(plainInput.fullName, plainInput.email, plainInput.interestType).catch(() => {});

      const dbInput = {
        ...plainInput,
        fullName: encryptIfAvailable(plainInput.fullName),
        email: encryptIfAvailable(plainInput.email),
        phone: plainInput.phone ? encryptIfAvailable(plainInput.phone) : undefined,
      };

      await storage.createContactRequest(dbInput);

      res.status(201).json({ success: true, message: "Thank you for contacting Hanvitt Advisors." });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input. Please check your form fields.",
        });
      }
      console.error("Contact form error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post(api.retirement.calculate.path, async (req, res) => {
    try {
      const input = api.retirement.calculate.input.parse(req.body);
      const result = calculateRetirement(input);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input. Please check your values." });
      }
      console.error("Retirement calculation error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Calculation failed. Please try again." });
    }
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many AI requests. Please try again after 15 minutes." },
  });

  app.post(api.retirement.aiAnalysis.path, aiLimiter, async (req, res) => {
    try {
      const input = api.retirement.aiAnalysis.input.parse(req.body);
      const recommendations = await getAIRetirementAnalysis(input);
      res.json({ recommendations });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input for AI analysis." });
      }
      console.error("AI analysis error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "AI analysis unavailable. Please try again later." });
    }
  });

  app.get('/api/insurance-gap/pdf', (_req, res) => {
    try {
      generateInsuranceGapPdf(res);
    } catch (err) {
      console.error("PDF generation error:", err instanceof Error ? err.message : "unknown");
      res.status(500).json({ message: "Failed to generate PDF. Please try again." });
    }
  });

  return httpServer;
}
