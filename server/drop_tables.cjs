const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Tarompa1@localhost:5432/bi_tabek_patah'
});

async function dropUnusedSpatialTables() {
  try {
    const res = await pool.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public'");

    const keepSet = new Set([
      'sensus_keluarga',
      'sensus_individu',
      'users',
      'admin_users',
      'activity_logs',
      'geography_columns',
      'geometry_columns',
      'spatial_ref_sys'
    ]);

    const itemsToDrop = res.rows.filter(r => !keepSet.has(r.table_name));

    console.log('Items to drop:', itemsToDrop.map(i => i.table_name));

    for (const item of itemsToDrop) {
      const type = item.table_type === 'VIEW' ? 'VIEW' : 'TABLE';
      try {
        await pool.query(`DROP ${type} IF EXISTS "${item.table_name}" CASCADE;`);
        console.log(`✓ Dropped ${type} "${item.table_name}"`);
      } catch (err) {
        console.error(`✕ Failed to drop ${item.table_name}:`, err.message);
      }
    }

    console.log('🎉 Cleanup complete! PostgreSQL database is clean with only active core tables remaining.');
    pool.end();
  } catch (err) {
    console.error('Error in cleanup:', err);
  }
}

dropUnusedSpatialTables();
