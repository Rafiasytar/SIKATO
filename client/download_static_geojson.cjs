const fs = require('fs');
const path = require('path');

async function downloadAllLayers() {
  const geojsonDir = path.join(__dirname, 'src', 'data', 'geojson');
  if (!fs.existsSync(geojsonDir)) {
    fs.mkdirSync(geojsonDir, { recursive: true });
  }

  try {
    const res = await fetch('http://localhost:5000/api/spatial/layers');
    const json = await res.json();
    const layers = json.data || [];

    console.log(`Found ${layers.length} layers to download...`);

    const manifest = [];

    for (const layer of layers) {
      const tableName = layer.table;
      try {
        const layerRes = await fetch(`http://localhost:5000/api/spatial/${encodeURIComponent(tableName)}`);
        const layerJson = await layerRes.json();
        const data = layerJson.data;

        const filePath = path.join(geojsonDir, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

        manifest.push({
          table: tableName,
          name: layer.table.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          file: `${tableName}.json`,
          featureCount: data?.features?.length || 0,
          type: layer.type
        });

        console.log(`✓ Saved ${tableName}.json (${data?.features?.length || 0} features)`);
      } catch (e) {
        console.error(`✕ Failed to download ${tableName}:`, e.message);
      }
    }

    fs.writeFileSync(path.join(geojsonDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    console.log('🎉 Manifest and all static GeoJSON files successfully exported to src/data/geojson/!');
  } catch (err) {
    console.error('API download error:', err.message);
  }
}

downloadAllLayers();
