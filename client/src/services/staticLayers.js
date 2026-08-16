import manifest from '../data/geojson/manifest.json'

const geojsonModules = import.meta.glob('../data/geojson/*.json', { eager: true })

export function getStaticSpatialLayers() {
  return manifest.map((item) => ({
    schema: 'public',
    table: item.table,
    name: item.name,
    type: item.type,
    featureCount: item.featureCount,
  }))
}

export function getStaticSpatialLayer(tableName) {
  const filePath = `../data/geojson/${tableName}.json`
  const module = geojsonModules[filePath]

  if (module) {
    const data = module.default || module
    return {
      layer: {
        table: tableName,
        name: tableName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      },
      data,
    }
  }

  throw new Error(`Static layer ${tableName} not found in repository.`)
}
