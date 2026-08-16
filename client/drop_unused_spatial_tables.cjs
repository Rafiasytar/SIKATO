const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/project web/Web BI tabek patah BE/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres'
});

async function dropUnusedSpatialTables() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const tables = res.rows.map(r => r.table_name);

    // Keep core survey and user tables
    const keepTables = ['sensus_keluarga', 'sensus_individu', 'users'];
    const tablesToDrop = tables.filter(t => !keepTables.includes(t));

    console.log('Tables to drop:', tablesToDrop);

    for (const table of tablesToDrop) {
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`✓ Dropped table "${table}"`);
    }

    console.log('🎉 Cleanup complete! PostgreSQL database is now clean with only core active tables left.');
    pool.end();
  } catch (err) {
    console.error('Error dropping tables:', err);
  }
}

dropUnusedSpatialTables();
