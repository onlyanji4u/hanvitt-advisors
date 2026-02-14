import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import nodemailer from "nodemailer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // HSTS: 1 year
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://images.unsplash.com",
      "child-src 'self' https://www.google.com",
      "frame-src 'self' https://www.google.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "x-content-type-options nosniff",
      "x-frame-options DENY",
      "x-xss-protection 1; mode=block"
    ].join("; ");
    
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Contact Form Endpoint
  app.post(api.contact.create.path, async (req, res) => {
    try {
      const input = api.contact.create.input.parse(req.body);
      const result = await storage.createContactRequest(input);

      // Email Notification Logic
      // NOTE: In a real production environment, you would use environment variables
      // for SMTP configuration (host, port, user, pass).
      // This is a template for the email sending logic.
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

        const mailOptions = {
          from: `"Hanvitt Advisors" <noreply@hanvitt.in>`,
          to: "help@hanvitt.in",
          subject: `New Consultation Request from ${input.name}`,
          text: `
            Name: ${input.name}
            Email: ${input.email}
            Phone: ${input.phone || "N/A"}
            Message: ${input.message}
          `,
          html: `
            <h3>New Consultation Request</h3>
            <p><strong>Name:</strong> ${input.name}</p>
            <p><strong>Email:</strong> ${input.email}</p>
            <p><strong>Phone:</strong> ${input.phone || "N/A"}</p>
            <p><strong>Message:</strong> ${input.message}</p>
          `,
        };

        // We attempt to send, but we don't block the response to the user
        // if the email fails (since the data is already in the database).
        transporter.sendMail(mailOptions).catch(err => {
          console.error("Email notification failed:", err);
        });
      } catch (emailErr) {
        console.error("Transporter setup failed:", emailErr);
      }

      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
