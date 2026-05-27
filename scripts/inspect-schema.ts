import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Error fetching profiles:", error);
  } else if (data && data.length > 0) {
    console.log("Profiles columns:", Object.keys(data[0]));
  } else {
    console.log("Profiles table is empty, creating a dummy user to inspect...");
    // Let's inspect the table definition by trying to select something
    const { data: cols, error: colsErr } = await supabase.rpc("get_columns", { table_name: "profiles" });
    if (colsErr) {
      console.error("RPC error:", colsErr);
    } else {
      console.log("Columns from RPC:", cols);
    }
  }
}

test().catch(console.error);
