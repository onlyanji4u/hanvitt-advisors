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
