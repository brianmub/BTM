import 'dotenv/config';
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";
import cors from 'cors';

const app = express();
const log = console.log;

// Basic configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve the Mobile Expo Landing Page at a specific route or under specific conditions
function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json"); // Check root app.json
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "Church Programs Pro";
  } catch {
    // Try mobile app.json as fallback
    try {
      const appJsonPath = path.resolve(process.cwd(), "mobile", "app.json");
      const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
      const appJson = JSON.parse(appJsonContent);
      return appJson.expo?.name || "Church Programs Pro";
    } catch {
      return "Church Programs Pro";
    }
  }
}

function serveMobileLandingPage(req: Request, res: Response) {
  const templatePath = path.resolve(process.cwd(), "server", "templates", "landing-page.html");
  if (!fs.existsSync(templatePath)) return res.status(404).send("Mobile landing page template not found");
  
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

// 1. Handle API Routes first
(async () => {
  const server = await registerRoutes(app);

  // 2. Serve Expo Manifest if requested by Expo Go
  app.get("/manifest", (req, res) => {
    const platform = req.header("expo-platform");
    if (platform === "ios" || platform === "android") {
        const manifestPath = path.resolve(process.cwd(), "mobile", "static-build", platform, "manifest.json");
        if (fs.existsSync(manifestPath)) {
            res.setHeader("expo-protocol-version", "1");
            res.setHeader("content-type", "application/json");
            return res.send(fs.readFileSync(manifestPath, "utf-8"));
        }
    }
    res.status(404).json({ error: "Manifest not found" });
  });

  // 3. Serve Mobile Landing Page at /download
  app.get("/download", (req, res) => serveMobileLandingPage(req, res));

  // 4. Serve Static Files from Vite build (dist/)
  const distPath = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
      log(`Serving static files from ${distPath}`);
      app.use(express.static(distPath));

      // 5. Catch-all: serve index.html for React Router SPA (Web App)
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
        res.sendFile(path.resolve(distPath, "index.html"));
      });
  } else {
      log("Warning: 'dist' folder not found. Web app static files will not be served.");
      // Fallback: serve landing page on root if web app build is missing
      app.get("/", (req, res) => serveMobileLandingPage(req, res));
  }

  // Error handling
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`integrated server serving on port ${port}`);
  });
})();
