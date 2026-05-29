import { Router } from "express";
import { z } from "zod";
import { db } from "../db/db";

const router = Router();

const reportSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  type: z.enum(["public", "fuel_station"]),
  image_url: z.string().optional(),
  description: z.string().optional()
});

const voteSchema = z.object({
  id: z.number(),
  vote: z.enum(["up", "down"])
});

router.post("/report", (req, res) => {
  const body = reportSchema.parse(req.body);

  const insertStmt = db.prepare(
    "INSERT INTO washrooms (lat, lng, type, status, upvotes, downvotes, image_url, description) VALUES (?, ?, ?, 'unverified', 0, 0, ?, ?)"
  );
  
  const result = insertStmt.run(
    body.lat,
    body.lng,
    body.type,
    body.image_url || null,
    body.description || null
  );
  
  res.json({ success: true, id: result.lastInsertRowid });
});

router.post("/vote", (req, res) => {
  const { id, vote } = voteSchema.parse(req.body);

  // Get current
  const washroom = db.prepare("SELECT upvotes, downvotes FROM washrooms WHERE id = ?").get(id) as any;
  if (!washroom) {
    return res.status(404).json({ error: "Washroom not found" });
  }

  let { upvotes, downvotes } = washroom;
  if (vote === "up") upvotes++;
  if (vote === "down") downvotes++;

  let status = "unverified";
  const net = upvotes - downvotes;
  if (net > 5) status = "good";
  if (net < -5) status = "bad";

  const updateStmt = db.prepare(
    "UPDATE washrooms SET upvotes = ?, downvotes = ?, status = ? WHERE id = ?"
  );
  updateStmt.run(upvotes, downvotes, status, id);

  res.json({ success: true, status, upvotes, downvotes });
});

export default router;
