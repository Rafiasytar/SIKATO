export const sourceFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfMT0M8FZf-ZcVPDyb0WQKcq8Cyfju6WBylMsH9juUPlxFPzg/viewform?usp=send_form'

export function normalizeColumnName(label, index) {
  const normalized = String(label || `kolom_${index + 1}`)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || `kolom_${index + 1}`
}

export function buildSchema(headers, rows) {
  const usedNames = new Map()

  return headers.map((header, index) => {
    const baseName = normalizeColumnName(header, index)
    const currentCount = usedNames.get(baseName) ?? 0
    usedNames.set(baseName, currentCount + 1)

    const columnName = currentCount === 0 ? baseName : `${baseName}_${currentCount + 1}`

    return {
      id: columnName,
      label: String(header || `Kolom ${index + 1}`).trim(),
      sqlType: inferSqlType(rows.map((row) => row[index]), header),
      required: index === 0,
      originalIndex: index,
    }
  })
}

export function buildSchemaFromQuestions(questions) {
  return buildSchema(questions, [])
}

export function rowsToObjects(schema, rows) {
  return rows.map((row, rowIndex) => {
    const item = { id: rowIndex + 1 }

    schema.forEach((field) => {
      item[field.id] = formatCellValue(row[field.originalIndex])
    })

    return item
  })
}

export function buildCreateTableSql(schema, tableName = 'sensus_tabek_patah') {
  const columnSql = schema.map((field) => {
    const nullable = field.required ? ' NOT NULL' : ''
    return `  ${field.id} ${field.sqlType}${nullable}`
  })

  return [
    `CREATE TABLE ${tableName} (`,
    '  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
    ...columnSql.map((line, index) => `${line}${index === columnSql.length - 1 ? '' : ','}`),
    ');',
  ].join('\n')
}

function inferSqlType(values, label = '') {
  const filledValues = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
  const labelText = String(label).toLowerCase()

  if (labelText.includes('koordinat') || labelText.includes('luas') || labelText.includes('rata-rata') || labelText.includes('rata rata')) {
    return 'DECIMAL(14,2)'
  }

  if (labelText.includes('nomor kk') || labelText.includes('nik') || labelText.includes('nop pbb') || labelText.includes('nomor hp')) {
    return 'VARCHAR(32)'
  }

  if (labelText.includes('jumlah') || labelText.includes('berapa') || labelText.includes('umur')) {
    return 'BIGINT'
  }

  if (labelText.includes('foto') || labelText.includes('lampiran')) {
    return 'TEXT'
  }

  if (!filledValues.length) {
    return 'TEXT'
  }

  if (filledValues.every((value) => value instanceof Date || isDateText(value))) {
    return 'TIMESTAMP'
  }

  if (filledValues.every((value) => typeof value === 'number' || isNumericText(value))) {
    return filledValues.some((value) => String(value).includes(',')) ? 'DECIMAL(14,2)' : 'BIGINT'
  }

  return 'TEXT'
}

function formatCellValue(value) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function isNumericText(value) {
  return /^-?\d+([.,]\d+)?$/.test(String(value).trim())
}

function isDateText(value) {
  const text = String(value).trim()
  return /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(text) && !Number.isNaN(Date.parse(text))
}
