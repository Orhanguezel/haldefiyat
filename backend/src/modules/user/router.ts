import type { FastifyInstance } from "fastify";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "@/db/client";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import bcrypt from "bcryptjs";

type UserPasswordRow = RowDataPacket & { id: string; password_hash: string };

export async function registerUser(app: FastifyInstance) {
  /**
   * POST /api/v1/user/change-password
   */
  app.post("/user/change-password", { onRequest: [requireAuth] }, async (req, reply) => {
    const parsed = z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(8),
    }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz veri" });

    const userId = getAuthUserId(req);
    const [rows] = await pool.query<UserPasswordRow[]>(
      "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    const user = rows[0];
    if (!user) return reply.status(404).send({ error: "Kullanici bulunamadi" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
    if (!valid) return reply.status(400).send({ error: "Mevcut sifre yanlis" });

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);
    return reply.send({ ok: true });
  });
}
