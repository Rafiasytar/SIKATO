const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/project web/Web BI tabek patah BE/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres'
});

async function exportSpatialLayers() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const tables = res.rows.map(r => r.table_name);
    console.log('Database tables:', tables);

    const spatialTables = tables.filter(t => !['sensus_keluarga', 'sensus_individu', 'users', 'spatial_layers'].includes(t));
    console.log('Spatial vector tables:', spatialTables);

    const geojsonDir = path.join(__dirname, 'src', 'data', 'geojson');
    if (!fs.existsSync(geojsonDir)) {
      fs.mkdirSync(geojsonDir, { recursive: true });
    }

    const exportedManifest = [];

    for (const table of spatialTables) {
      try {
        const query = `
          SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', coalesce(jsonb_agg(ST_AsGeoJSON(t.*)::jsonb), '[]'::jsonb)
          ) AS geojson
          FROM "${table}" t;
        `;
        const result = await pool.query(query);
        const geojson = result.rows[0]?.geojson;

        const filePath = path.join(geojsonDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(geojson, null, 2), 'utf8');

        // Readable name formatting
        const readableName = table
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        exportedManifest.push({
          table: table,
          name: readableName,
          file: `${table}.json`,
          featureCount: geojson?.features?.length || 0
        });

        console.log(`Exported ${table}: ${geojson?.features?.length || 0} features -> ${table}.json`);
      } catch (err) {
        console.error(`Failed to export ${table}:`, err.message);
      }
    }

    // Save manifest file
    fs.writeFileSync(path.join(geojsonDir, 'manifest.json'), JSON.stringify(exportedManifest, null, 2), 'utf8');
    console.log('Manifest exported successfully!');

    pool.end();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

exportSpatialLayers();
