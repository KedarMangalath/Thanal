import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db";

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

export default router;
