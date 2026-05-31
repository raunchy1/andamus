import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌  Missing required env vars.\n' +
      '   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VehicleModel {
  name: string;
  slug: string;
  body_type?: string | null;
  is_popular?: boolean;
  sort_order?: number;
}

interface VehicleMake {
  name: string;
  slug: string;
  country?: string | null;
  is_popular?: boolean;
  sort_order?: number;
  models?: VehicleModel[];
}

interface VehicleCatalog {
  makes: VehicleMake[];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seedVehicles(): Promise<void> {
  console.log('🚗  Seeding vehicle catalog...\n');

  const catalogPath = path.join(process.cwd(), 'public', 'data', 'vehicle-catalog.json');

  if (!fs.existsSync(catalogPath)) {
    console.error(`❌  Catalog file not found at: ${catalogPath}`);
    process.exit(1);
  }

  const catalog: VehicleCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  if (!Array.isArray(catalog.makes) || catalog.makes.length === 0) {
    console.error('❌  Catalog has no makes. Check the JSON structure.');
    process.exit(1);
  }

  let makesInserted = 0;
  let modelsInserted = 0;
  let errors = 0;

  for (const make of catalog.makes) {
    // ------------------------------------------------------------------
    // Upsert make
    // ------------------------------------------------------------------
    const { data: makeData, error: makeError } = await supabase
      .from('vehicle_makes')
      .upsert(
        {
          name: make.name,
          slug: make.slug,
          country: make.country ?? null,
          is_popular: make.is_popular ?? false,
          sort_order: make.sort_order ?? 999,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (makeError || !makeData) {
      console.error(`  ❌  Make "${make.name}": ${makeError?.message ?? 'No data returned'}`);
      errors++;
      continue;
    }

    makesInserted++;
    const makeId: string = makeData.id;
    const models = make.models ?? [];

    // ------------------------------------------------------------------
    // Upsert models in batches of 50 to stay within Supabase limits
    // ------------------------------------------------------------------
    const BATCH_SIZE = 50;
    let makeModelErrors = 0;

    for (let i = 0; i < models.length; i += BATCH_SIZE) {
      const batch = models.slice(i, i + BATCH_SIZE).map((model, idx) => ({
        make_id: makeId,
        name: model.name,
        slug: model.slug,
        body_type: model.body_type ?? null,
        is_popular: model.is_popular ?? false,
        sort_order: model.sort_order ?? i + idx + 1,
      }));

      const { error: batchError } = await supabase
        .from('vehicle_models')
        .upsert(batch, { onConflict: 'make_id,slug' });

      if (batchError) {
        console.error(`    ❌  Models batch for "${make.name}": ${batchError.message}`);
        makeModelErrors++;
        errors++;
      } else {
        modelsInserted += batch.length;
      }
    }

    const status = makeModelErrors > 0 ? '⚠️ ' : '✅';
    console.log(`  ${status} ${make.name}: ${models.length} model(s)`);
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n────────────────────────────────────────');
  console.log('🎉  Seed complete!');
  console.log(`    Makes inserted/updated : ${makesInserted}`);
  console.log(`    Models inserted/updated: ${modelsInserted}`);
  console.log(`    Errors                 : ${errors}`);
  console.log('────────────────────────────────────────\n');

  if (errors > 0) {
    process.exit(1);
  }
}

seedVehicles().catch((err: unknown) => {
  console.error('❌  Unexpected error:', err);
  process.exit(1);
});
