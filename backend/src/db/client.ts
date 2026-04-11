import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "@/core/env";
import * as schema from "./schema";

export const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

export const db = drizzle(pool, { schema, mode: "default" });
