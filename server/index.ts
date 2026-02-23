import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const required = ["DATABASE_URL", "RECAPTCHA_SECRET_KEY", "SMTP_USER", "SMTP_PASS", "ENCRYPTION_KEY"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(cookieParser());

app.use(
  express.json({
    limit: "10kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10kb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const safeLog = { message: capturedJsonResponse.message };
        logLine += ` :: ${JSON.stringify(safeLog)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message: status >= 500 ? "Something went wrong. Please try again later." : (err.message || "Request failed.") });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  const PURGE_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;
  const runPurge = async () => {
    try {
      const result = await storage.purgeOldRecords(14);
      if (result.contactsDeleted > 0 || result.logsDeleted > 0) {
        log(`Purged ${result.contactsDeleted} contact requests and ${result.logsDeleted} security logs older than 14 days`);
      }
    } catch (err) {
      console.error("Purge failed:", err instanceof Error ? err.message : "unknown");
    }
  };
  runPurge();
  setInterval(runPurge, PURGE_INTERVAL_MS);

  const ADMIN_EMAIL = "hanvitt.advisors@gmail.com";
  try {
    const existing = await storage.getAdminByEmail(ADMIN_EMAIL);
    if (!existing) {
      await storage.createAdminUser(ADMIN_EMAIL);
      log(`Admin user seeded: ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error("Admin seed error:", err instanceof Error ? err.message : "unknown");
  }

  try {
    const caTaxSetting = await storage.getSetting("ca_tax_enabled");
    if (caTaxSetting === undefined) {
      await storage.setSetting("ca_tax_enabled", "true");
      log("Default setting seeded: ca_tax_enabled = true");
    }
  } catch (err) {
    console.error("Settings seed error:", err instanceof Error ? err.message : "unknown");
  }

  // One-time seed: copy CA services & cross-sell offers if tables are empty
  try {
    const existingServices = await storage.getCaServices();
    if (existingServices.length === 0) {
      log("Seeding CA services...");
      const servicesSeed = [
        { serviceName: "Salaried ( Simple ITR-1)", description: "Individual", category: "ITR Filing", priceMin: "900.00", priceMax: "1499.00", frequency: "", isActive: true },
        { serviceName: "Salaried + Capital Gains", description: "Individual", category: "ITR Filing", priceMin: "2500.00", priceMax: "5000.00", frequency: "", isActive: true },
        { serviceName: "Freelancer / Consultant ITR", description: "Individual (1 source + business income)", category: "ITR Filing", priceMin: "3500.00", priceMax: "6000.00", frequency: "", isActive: true },
        { serviceName: "Business Income ITR (Proprietor)", description: "Individual (Schedule C/Profit & Loss)", category: "ITR Filing", priceMin: "6000.00", priceMax: "12000.00", frequency: "", isActive: true },
        { serviceName: "Tax Revision/Rectification", description: "Individual (Post-filing corrections)", category: "ITR Filing", priceMin: "1500.00", priceMax: "4000.00", frequency: "", isActive: true },
        { serviceName: "NRI Filing", description: "Individual", category: "NRI Tax", priceMin: "5000.00", priceMax: "12000.00", frequency: "", isActive: true },
        { serviceName: "Registration", description: "Individuals & Small Businesses", category: "GST", priceMin: "1500.00", priceMax: "3000.00", frequency: "One Time", isActive: true },
        { serviceName: "GST Return Filing (GSTR-1, GSTR-3B)", description: "Individuals & Small Businesses", category: "GST", priceMin: "1999.00", priceMax: "3500.00", frequency: "Monthly / Quarterly", isActive: true },
        { serviceName: "GST Annual Return", description: "Individuals & Small Businesses", category: "GST", priceMin: "3000.00", priceMax: "6000.00", frequency: "Annual", isActive: true },
        { serviceName: "GST Notice Handling", description: "Individuals & Small Businesses", category: "GST", priceMin: "5000.00", priceMax: "15000.00", frequency: "Case basis", isActive: true },
        { serviceName: "GST Audit Support", description: "Individuals & Small Businesses", category: "Audit", priceMin: "8000.00", priceMax: "20000.00", frequency: "Once per year", isActive: true },
        { serviceName: "Proprietorship Registration", description: "Medium & Small Business", category: "Compliance", priceMin: "4000.00", priceMax: "8000.00", frequency: "One-Time", isActive: true },
        { serviceName: "Private Ltd Company Registration", description: "Medium & Small Business", category: "Compliance", priceMin: "12000.00", priceMax: "25000.00", frequency: "One-Time", isActive: true },
        { serviceName: "Shop & Establishment", description: "Medium & Small Business", category: "Compliance", priceMin: "1500.00", priceMax: "4000.00", frequency: "One-Time", isActive: true },
      ];
      const createdServiceMap: Record<string, string> = {};
      for (const s of servicesSeed) {
        const created = await storage.createCaService(s as any);
        createdServiceMap[s.serviceName] = created.id;
        log(`Seeded service: ${s.serviceName}`);
      }

      // Seed cross-sell offers
      const simpleItrId = createdServiceMap["Salaried ( Simple ITR-1)"];
      const capitalGainsId = createdServiceMap["Salaried + Capital Gains"];
      if (simpleItrId) {
        await storage.createCrossSellOffer({
          triggerProduct: "term_insurance",
          offerTitle: "Free ITR Filing",
          offerDescription: "Buy ₹2 Cr Term Insurance → Get FREE Income Tax Filing!\nSecure your family. Save on taxes. Limited period benefit. Only at Hanvitt",
          offerType: "free_service",
          discountValue: null as any,
          freeServiceId: simpleItrId,
          isActive: true,
          startDate: "2026-02-23",
          endDate: "2026-07-31",
        });
        log("Seeded offer: Free ITR Filing");
      }
      if (capitalGainsId) {
        await storage.createCrossSellOffer({
          triggerProduct: "term_insurance",
          offerTitle: "Salaried + Capital Gains",
          offerDescription: "Buy ₹3 Cr Term Insurance → Get FREE Income Tax Filing along with Capital Gains calculations !\nSecure your family. Save on taxes. Limited period benefit.\nOnly at Hanvitt.",
          offerType: "free_service",
          discountValue: null as any,
          freeServiceId: capitalGainsId,
          isActive: true,
          startDate: "2026-02-23",
          endDate: "2026-07-31",
        });
        log("Seeded offer: Salaried + Capital Gains");
      }
      log("CA services & offers seed complete.");
    }
  } catch (err) {
    console.error("CA services seed error:", err instanceof Error ? err.message : "unknown");
  }
})();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason instanceof Error ? reason.message : "unknown");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  if (isProduction) {
    process.exit(1);
  }
});
