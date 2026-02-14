import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeInput(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
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
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-src 'none'",
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
    next();
  });

  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again after 15 minutes." },
  });

  app.post(api.contact.create.path, contactLimiter, async (req, res) => {
    try {
      const raw = api.contact.create.input.parse(req.body);
      const input = {
        name: sanitizeInput(raw.name),
        email: sanitizeInput(raw.email),
        phone: raw.phone ? sanitizeInput(raw.phone) : undefined,
        message: sanitizeInput(raw.message),
      };

      const result = await storage.createContactRequest(input);

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: true, 
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const safeName = escapeHtml(input.name);
        const safeEmail = escapeHtml(input.email);
        const safePhone = escapeHtml(input.phone || "N/A");
        const safeMessage = escapeHtml(input.message);

        const mailOptions = {
          from: process.env.EMAIL_FROM || `"Hanvitt Advisors" <noreply@hanvitt.in>`,
          to: process.env.EMAIL_TO || "help@hanvitt.in",
          subject: `New Consultation Request from ${safeName}`,
          text: `Name: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "N/A"}\nMessage: ${input.message}`,
          html: `<h3>New Consultation Request</h3><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Phone:</strong> ${safePhone}</p><p><strong>Message:</strong> ${safeMessage}</p>`,
        };

        transporter.sendMail(mailOptions).catch(err => {
          console.error("Email notification failed:", err);
        });
      } catch (emailErr) {
        console.error("Transporter setup failed:", emailErr);
      }

      res.status(201).json({ id: result.id, message: "Request submitted successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid input. Please check your form fields.",
        });
      }
      throw err;
    }
  });

  return httpServer;
}
