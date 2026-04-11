import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { env } from "@/core/env";
import { cleanSql, splitStatements, logStep } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Flags = {
  noDrop?: boolean;
  only?: string[];
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (const a of argv.slice(2)) {
    if (a === "--no-drop") flags.noDrop = true;
    else if (a.startsWith("--only=")) {
      flags.only = a.replace("--only=", "").split(",").map((s) => s.trim());
    }
  }
  return flags;
}

function assertSafeToDrop(dbName: string) {
  const allowDrop = process.env.ALLOW_DROP === "true";
  const isProd = process.env.NODE_ENV === "production";
  const isSystem = ["mysql", "information_schema", "performance_schema", "sys"].includes(
    dbName.toLowerCase(),
  );
  if (isSystem) throw new Error(`Sistem DB'si drop edilemez: ${dbName}`);
  if (isProd && !allowDrop) throw new Error("Prod ortamda DROP icin ALLOW_DROP=true bekleniyor.");
}

async function dropAndCreate(root: mysql.Connection) {
  assertSafeToDrop(env.DB.name);
  await root.query(`DROP DATABASE IF EXISTS \`${env.DB.name}\`;`);
  await root.query(
    `CREATE DATABASE \`${env.DB.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
}

async function createRoot(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: process.env.DB_ROOT_USER || "root",
    password: process.env.DB_ROOT_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || env.DB.password,
    multipleStatements: true,
  });
}

async function createConnToDb(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
    multipleStatements: true,
    charset: "utf8mb4_unicode_ci",
  });
}

function shouldRun(file: string, flags: Flags) {
  if (!flags.only?.length) return true;
  const m = path.basename(file).match(/^(\d+)/);
  const prefix = m?.[1];
  return prefix ? flags.only.includes(prefix) : false;
}

function getAdminVars() {
  const email = (process.env.ADMIN_EMAIL || "orhanguzell@gmail.com").trim();
  const id = (process.env.ADMIN_ID || "4f618a8d-6fdb-498c-898a-395d368b2193").trim();
  const plainPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = bcrypt.hashSync(plainPassword, 12);
  return { email, id, passwordHash };
}

function sqlStr(v: string) {
  return v.replaceAll("'", "''");
}

function prepareSql(rawSql: string, admin: { email: string; id: string; passwordHash: string }) {
  let sqlText = cleanSql(rawSql);

  const header = [
    `SET @ADMIN_EMAIL := '${sqlStr(admin.email)}';`,
    `SET @ADMIN_ID := '${sqlStr(admin.id)}';`,
    `SET @ADMIN_PASSWORD_HASH := '${sqlStr(admin.passwordHash)}';`,
  ].join("\n");

  sqlText = sqlText
    .replaceAll("{{ADMIN_PASSWORD_HASH}}", admin.passwordHash)
    .replaceAll("{{ADMIN_EMAIL}}", admin.email)
    .replaceAll("{{ADMIN_ID}}", admin.id);

  return `${header}\n${sqlText}`;
}

async function runSqlFile(
  conn: mysql.Connection,
  absPath: string,
  adminVars: { email: string; id: string; passwordHash: string },
) {
  const name = path.basename(absPath);
  logStep(`⏳ ${name} calisıyor...`);
  const raw = fs.readFileSync(absPath, "utf8");
  const sqlText = prepareSql(raw, adminVars);
  const statements = splitStatements(sqlText);

  await conn.query("SET NAMES utf8mb4;");
  await conn.query("SET time_zone = '+00:00';");

  for (const stmt of statements) {
    if (!stmt) continue;
    await conn.query(stmt);
  }
  logStep(`✅ ${name} bitti`);
}

async function main() {
  const flags = parseFlags(process.argv);

  if (!flags.noDrop) {
    const root = await createRoot();
    logStep("DROP + CREATE basliyor");
    await dropAndCreate(root);
    logStep("DB olusturuldu");
    await root.end();
  } else {
    logStep("--no-drop: DROP/CREATE atlaniyor");
  }

  const conn = await createConnToDb();

  try {
    const ADMIN = getAdminVars();

    const envDir = process.env.SEED_SQL_DIR && process.env.SEED_SQL_DIR.trim();
    const distSql = path.resolve(__dirname, "sql");
    const srcSql = path.resolve(__dirname, "../../../src/db/seed/sql");
    const sqlDir = envDir ? path.resolve(envDir) : fs.existsSync(distSql) ? distSql : srcSql;

    const files = fs
      .readdirSync(sqlDir)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const f of files) {
      const abs = path.join(sqlDir, f);
      if (!shouldRun(abs, flags)) {
        logStep(`⏭️ ${f} atlandi`);
        continue;
      }
      await runSqlFile(conn, abs, ADMIN);
    }
    logStep("🎉 Seed tamamlandi.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
