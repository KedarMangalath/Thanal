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

router.get("/reports", (_request, response) => {
  const reports = db
    .prepare("SELECT * FROM community_reports ORDER BY created_at DESC LIMIT 100")
    .all();
  response.json(reports);
});

router.post("/reports", (request, response) => {
  const report = reportSchema.parse(request.body);
  const result = db
    .prepare(
      `INSERT INTO community_reports (type, title, description, lat, lng, severity)
       VALUES (@type, @title, @description, @lat, @lng, @severity)`
    )
    .run({
      ...report,
      description: report.description ?? null
    });

  response.status(201).json({ id: result.lastInsertRowid, ...report });
});

router.get("/flood-zones", (_request, response) => {
  response.json(db.prepare("SELECT * FROM flood_zones ORDER BY severity DESC, name ASC").all());
});

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "other"]),
  message: z.string().min(2).max(2000),
  email: z.string().email().optional().or(z.literal(""))
});

router.post("/feedback", (request, response) => {
  const body = feedbackSchema.parse(request.body);
  const result = db
    .prepare("INSERT INTO feedback (type, message, email) VALUES (@type, @message, @email)")
    .run({
      type: body.type,
      message: body.message,
      email: body.email || null
    });

  response.status(201).json({ success: true, id: result.lastInsertRowid });
});

router.get("/feedback", adminAuth, (_request, response) => {
  response.json(db.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all());
});

const speedCameraSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

router.get("/speed-cameras", (_request, response) => {
  const cameras = db.prepare("SELECT * FROM speed_cameras").all();
  response.json(cameras);
});

router.post("/speed-camera", (request, response) => {
  const body = speedCameraSchema.parse(request.body);
  const result = db
    .prepare("INSERT INTO speed_cameras (lat, lng, source, verified, status) VALUES (@lat, @lng, 'user', 0, 'active')")
    .run({ lat: body.lat, lng: body.lng });
  response.status(201).json({ success: true, id: result.lastInsertRowid });
});

const speedCameraReportSchema = z.object({
  type: z.enum(["incorrect_location", "removed", "other"]),
  notes: z.string().optional()
});

router.post("/speed-camera/:id/report", (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const body = speedCameraReportSchema.parse(request.body);
  const result = db
    .prepare("INSERT INTO speed_camera_reports (camera_id, type, notes) VALUES (@id, @type, @notes)")
    .run({ id, type: body.type, notes: body.notes || null });
  response.status(201).json({ success: true, id: result.lastInsertRowid });
});

router.get("/speed-camera-reports", adminAuth, (_request, response) => {
  const reports = db.prepare(`
    SELECT r.*, c.lat, c.lng 
    FROM speed_camera_reports r 
    JOIN speed_cameras c ON r.camera_id = c.id 
    ORDER BY r.created_at DESC
  `).all();
  response.json(reports);
});

router.delete("/speed-camera/:id", adminAuth, (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  db.prepare("UPDATE speed_cameras SET status = 'removed' WHERE id = ?").run(id);
  response.json({ success: true });
});

router.post("/speed-camera/:id/verify", adminAuth, (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  db.prepare("UPDATE speed_cameras SET verified = 1 WHERE id = ?").run(id);
  response.json({ success: true });
});

export default router;
