import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/layers', async (request, response, next) => {
  try {
    const result = await pool.query(`
      SELECT
        f_table_schema AS schema,
        f_table_name AS table,
        f_geometry_column AS geometry_column,
        srid,
        type
      FROM geometry_columns
      WHERE f_table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY f_table_schema, f_table_name
    `)

    response.json({ data: result.rows })
  } catch (error) {
    next(error)
  }
})

router.get('/:layer', async (request, response, next) => {
  try {
    const layer = request.params.layer
    const layerInfo = await findLayer(layer)

    if (!layerInfo) {
      response.status(404).json({ message: 'Layer spasial tidak ditemukan.' })
      return
    }

    const qualifiedTable = quoteQualifiedName(layerInfo.schema, layerInfo.table)
    const geometryColumn = quoteIdentifier(layerInfo.geometry_column)
    const normalizedGeometry = buildWgs84GeometrySql(geometryColumn)
    const limit = clampLimit(request.query.limit)

    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(${normalizedGeometry})::jsonb,
            'properties', to_jsonb(layer_row) - $1
          )
        ), '[]'::jsonb)
      ) AS geojson
      FROM (
        SELECT *
        FROM ${qualifiedTable}
        WHERE ${geometryColumn} IS NOT NULL
        LIMIT ${limit}
      ) AS layer_row
    `, [layerInfo.geometry_column])

    response.json({
      layer: layerInfo,
      data: result.rows[0]?.geojson ?? { type: 'FeatureCollection', features: [] },
    })
  } catch (error) {
    next(error)
  }
})

async function findLayer(layerName) {
  const result = await pool.query(`
    SELECT
      f_table_schema AS schema,
      f_table_name AS table,
      f_geometry_column AS geometry_column,
      srid,
      type
    FROM geometry_columns
    WHERE f_table_schema NOT IN ('pg_catalog', 'information_schema')
      AND f_table_name = $1
    LIMIT 1
  `, [layerName])

  return result.rows[0]
}

function clampLimit(value) {
  const parsedLimit = Number(value)

  if (!Number.isFinite(parsedLimit)) {
    return 5000
  }

  return Math.min(Math.max(Math.trunc(parsedLimit), 1), 20000)
}

function buildWgs84GeometrySql(geometryColumn) {
  return `
    CASE
      WHEN ST_SRID(${geometryColumn}) NOT IN (0, 4326) THEN ST_Transform(${geometryColumn}, 4326)
      WHEN ST_XMin(ST_Envelope(${geometryColumn})) BETWEEN -180 AND 180
        AND ST_XMax(ST_Envelope(${geometryColumn})) BETWEEN -180 AND 180
        AND ST_YMin(ST_Envelope(${geometryColumn})) BETWEEN -90 AND 90
        AND ST_YMax(ST_Envelope(${geometryColumn})) BETWEEN -90 AND 90
        THEN ST_SetSRID(${geometryColumn}, 4326)
      WHEN ST_XMin(ST_Envelope(${geometryColumn})) BETWEEN 100000 AND 900000
        AND ST_XMax(ST_Envelope(${geometryColumn})) BETWEEN 100000 AND 900000
        AND ST_YMin(ST_Envelope(${geometryColumn})) BETWEEN 9000000 AND 10000000
        AND ST_YMax(ST_Envelope(${geometryColumn})) BETWEEN 9000000 AND 10000000
        THEN ST_Transform(ST_SetSRID(${geometryColumn}, 32747), 4326)
      WHEN ST_XMin(ST_Envelope(${geometryColumn})) BETWEEN 10000000 AND 12000000
        AND ST_XMax(ST_Envelope(${geometryColumn})) BETWEEN 10000000 AND 12000000
        AND ST_YMin(ST_Envelope(${geometryColumn})) BETWEEN -1000000 AND 1000000
        AND ST_YMax(ST_Envelope(${geometryColumn})) BETWEEN -1000000 AND 1000000
        THEN ST_Transform(ST_SetSRID(${geometryColumn}, 3857), 4326)
      ELSE ST_SetSRID(${geometryColumn}, 4326)
    END
  `
}

function quoteQualifiedName(schema, table) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export default router
