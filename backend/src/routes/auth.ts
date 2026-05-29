import { Router } from "express";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  password: z.string()
});

router.post("/login", (request, response) => {
  const body = loginSchema.safeParse(request.body);
  if (!body.success) {
    return response.status(400).json({ error: "Invalid request" });
  }

  // Simple hardcoded admin password
  if (body.data.password === "alphaca_0910") {
    return response.json({ token: "admin-token-xyz" });
  }

  return response.status(401).json({ error: "Invalid password" });
});

export default router;
