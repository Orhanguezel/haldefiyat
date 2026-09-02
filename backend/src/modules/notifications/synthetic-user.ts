import { pool } from "@/db/client";
import type { RowDataPacket } from "mysql2";
import { isSyntheticEmail } from "./synthetic";

/** Kullanici kimliginden test hesabi olup olmadigini cozer. */
export async function isSyntheticUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const [rows] = await pool.query<(RowDataPacket & { email: string | null })[]>(
    "SELECT email FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  return isSyntheticEmail(rows[0]?.email);
}
