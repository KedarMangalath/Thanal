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

router.post("/report", async (req, res, next) => {
  try {
    const body = reportSchema.parse(req.body);

    const result = await db.run(
      "INSERT INTO washrooms (lat, lng, type, status, upvotes, downvotes, image_url, description) VALUES (?, ?, ?, 'unverified', 0, 0, ?, ?)",
      [
        body.lat,
        body.lng,
        body.type,
        body.image_url || null,
        body.description || null
      ]
    );
    
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    next(error);
  }
});

router.post("/vote", async (req, res, next) => {
  try {
    const { id, vote } = voteSchema.parse(req.body);

    // Get current
    const washrooms = await db.query("SELECT upvotes, downvotes FROM washrooms WHERE id = ?", [id]);
    const washroom = washrooms[0];
    if (!washroom) {
      res.status(404).json({ error: "Washroom not found" });
      return;
    }

    let { upvotes, downvotes } = washroom;
    if (vote === "up") upvotes++;
    if (vote === "down") downvotes++;

    let status = "unverified";
    const net = upvotes - downvotes;
    if (net > 5) status = "good";
    if (net < -5) status = "bad";

    await db.run(
      "UPDATE washrooms SET upvotes = ?, downvotes = ?, status = ? WHERE id = ?",
      [upvotes, downvotes, status, id]
    );

    res.json({ success: true, status, upvotes, downvotes });
  } catch (error) {
    next(error);
  }
});

export default router;
