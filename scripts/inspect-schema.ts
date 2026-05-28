import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log("Querying profiles table schema information...");
  
  const { data, error } = await supabase.rpc("inspect_table_columns", { table_name: "profiles" });
  
  if (error) {
    // If custom RPC is missing, query pg_attribute directly via custom SQL using a simple select
    console.log("RPC failed or missing, trying direct query on pg_catalog...");
    
    // We can run a query to get a single row to inspect columns
    const { data: row, error: rowError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);
      
    if (rowError) {
      console.error("Failed to query profiles table:", rowError.message);
    } else {
      console.log("Successfully fetched a row. Available columns are:");
      console.log(Object.keys(row[0] || {}));
    }
  } else {
    console.log("Table columns info:", data);
  }
}

inspectSchema();
