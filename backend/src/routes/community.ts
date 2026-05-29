import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const reportSchema = z.object({
  type: z.enum(["flood", "pothole", "block", "procession", "roadwork"]),
  title: z.string().min(2),
  description: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  severity: z.number().int().min(1).max(5).default(1)
});

router.get("/reports", async (_request, response, next) => {
  try {
    const reports = await db.query("SELECT * FROM community_reports ORDER BY created_at DESC LIMIT 100");
    response.json(reports);
  } catch (error) {
    next(error);
  }
});

router.post("/reports", async (request, response, next) => {
  try {
    const report = reportSchema.parse(request.body);
    const result = await db.run(
      `INSERT INTO community_reports (type, title, description, lat, lng, severity)
       VALUES (:type, :title, :description, :lat, :lng, :severity)`,
      {
        type: report.type,
        title: report.title,
        description: report.description ?? null,
        lat: report.lat,
        lng: report.lng,
        severity: report.severity
      }
    );

    response.status(201).json({ id: Number(result.lastInsertRowid), ...report });
  } catch (error) {
    next(error);
  }
});

router.get("/flood-zones", async (_request, response, next) => {
  try {
    const zones = await db.query("SELECT * FROM flood_zones ORDER BY severity DESC, name ASC");
    response.json(zones);
  } catch (error) {
    next(error);
  }
});

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "other"]),
  message: z.string().min(2).max(2000),
  email: z.string().email().optional().or(z.literal(""))
});

router.post("/feedback", async (request, response, next) => {
  try {
    const body = feedbackSchema.parse(request.body);
    const result = await db.run(
      "INSERT INTO feedback (type, message, email) VALUES (:type, :message, :email)",
      {
        type: body.type,
        message: body.message,
        email: body.email || null
      }
    );

    response.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    next(error);
  }
});

router.get("/feedback", adminAuth, async (_request, response, next) => {
  try {
    const feedback = await db.query("SELECT * FROM feedback ORDER BY created_at DESC");
    response.json(feedback);
  } catch (error) {
    next(error);
  }
});

const speedCameraSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

router.get("/speed-cameras", async (_request, response, next) => {
  try {
    const cameras = await db.query("SELECT * FROM speed_cameras");
    response.json(cameras);
  } catch (error) {
    next(error);
  }
});

router.post("/speed-camera", async (request, response, next) => {
  try {
    const body = speedCameraSchema.parse(request.body);
    const result = await db.run(
      "INSERT INTO speed_cameras (lat, lng, source, verified, status) VALUES (:lat, :lng, 'user', 0, 'active')",
      { lat: body.lat, lng: body.lng }
    );
    response.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    next(error);
  }
});

const speedCameraReportSchema = z.object({
  type: z.enum(["incorrect_location", "removed", "other"]),
  notes: z.string().optional()
});

router.post("/speed-camera/:id/report", async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const body = speedCameraReportSchema.parse(request.body);
    const result = await db.run(
      "INSERT INTO speed_camera_reports (camera_id, type, notes) VALUES (:id, :type, :notes)",
      { id, type: body.type, notes: body.notes || null }
    );
    response.status(201).json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    next(error);
  }
});

router.get("/speed-camera-reports", adminAuth, async (_request, response, next) => {
  try {
    const reports = await db.query(`
      SELECT r.*, c.lat, c.lng 
      FROM speed_camera_reports r 
      JOIN speed_cameras c ON r.camera_id = c.id 
      ORDER BY r.created_at DESC
    `);
    response.json(reports);
  } catch (error) {
    next(error);
  }
});

router.delete("/speed-camera/:id", adminAuth, async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    await db.run("UPDATE speed_cameras SET status = 'removed' WHERE id = ?", [id]);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/speed-camera/:id/verify", adminAuth, async (request, response, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    await db.run("UPDATE speed_cameras SET verified = 1 WHERE id = ?", [id]);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
