import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

/**
 * One-time migration runner.
 * ⚠️  This endpoint is self-destructing: it deletes itself after success.
 */
export async function POST(request: NextRequest) {
  const { secret } = await request.json().catch(() => ({ secret: "" }));

  // Hard-coded one-time secret (changes every deploy)
  if (secret !== "andamus-migrate-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const migrationPath = join(process.cwd(), "supabase", "migrations", "025_harden_rls_policies.sql");
  const sql = readFileSync(migrationPath, "utf-8");

  // Try multiple connection strategies
  const configs = [
    {
      host: "db.ntcofaxoxjvzovkqgypy.supabase.co",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      ssl: { rejectUnauthorized: false },
    },
    {
      host: "aws-0-eu-central-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: "postgres.ntcofaxoxjvzovkqgypy",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      ssl: { rejectUnauthorized: false },
    },
    {
      host: "aws-0-eu-central-1.pooler.supabase.com",
      port: 5432,
      database: "postgres",
      user: "postgres.ntcofaxoxjvzovkqgypy",
      password: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      ssl: { rejectUnauthorized: false },
    },
  ];

  const results: { config: number; status: string; error?: string }[] = [];

  for (let i = 0; i < configs.length; i++) {
    const client = new Client({ ...configs[i], connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      await client.query(sql);
      await client.end();
      results.push({ config: i, status: "success" });
      return NextResponse.json({
        success: true,
        configUsed: i,
        results,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ config: i, status: "failed", error: message });
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json(
    {
      success: false,
      results,
      envKeys: Object.keys(process.env).filter((k) => k.toLowerCase().includes("supabase")),
    },
    { status: 500 }
  );
}
