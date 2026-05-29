import { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== "Bearer admin-token-xyz") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
