import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret-change-in-production";
const OTP_EXPIRY_MINUTES = 5;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function generateAccessToken(adminId: string, email: string, role: string): string {
  return jwt.sign({ adminId, email, role }, JWT_SECRET, { expiresIn: "1h" });
}

export function generateRefreshToken(adminId: string): string {
  return jwt.sign({ adminId, type: "refresh" }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { adminId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { adminId: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { adminId: string };
  } catch {
    return null;
  }
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

export interface AuthenticatedRequest extends Request {
  admin?: { adminId: string; email: string; role: string };
}

export function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.admin = payload;
  next();
}

const otpRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkOtpRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = otpRateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    otpRateLimits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 3) {
    return false;
  }

  entry.count++;
  return true;
}
