import cors from "cors";
import express from "express";
import { loadBackendEnv } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import assistantRouter from "./routes/assistant";
import authRouter from "./routes/auth";
import communityRouter from "./routes/community";
import placesRouter from "./routes/places";
import railRouter from "./routes/rail";
import routeRouter from "./routes/route";
import savedRoutesRouter from "./routes/savedRoutes";
import weatherRouter from "./routes/weather";
import uploadRouter from "./routes/upload";
import washroomsRouter from "./routes/washrooms";
import path from "path";
import fs from "fs";

loadBackendEnv();

const app = express();
const port = Number(process.env.PORT ?? 4010);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "thanal-backend" });
});

app.use("/api/route", routeRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/places", placesRouter);
app.use("/api/rail", railRouter);
app.use("/api/community", communityRouter);
app.use("/api/auth", authRouter);
app.use("/api/saved-routes", savedRoutesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/washrooms", washroomsRouter);

const webDistPath = path.resolve(process.cwd(), "../packages/web/dist");
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get("/*any", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Thanal backend listening on http://localhost:${port}`);
  });
}

export default app;
