import { fixedTableSchema } from '../data/tableSchema'

export function getCompleteness(row, schema = fixedTableSchema) {
  const targetSchema = Array.isArray(schema) && schema.length > 0 ? schema : fixedTableSchema
  if (!row) {
    return { isComplete: true, percentage: 100, filledCount: 0, missingCount: 0, missingFields: [] }
  }

  const total = targetSchema.length
  let filled = 0
  const missingFields = []

  targetSchema.forEach((field) => {
    const val = row[field.id]
    if (
      val !== undefined &&
      val !== null &&
      String(val).trim() !== '' &&
      String(val).trim() !== '-' &&
      String(val).trim() !== 'null' &&
      String(val).trim() !== 'undefined' &&
      String(val).trim() !== 'Belum Diisi'
    ) {
      filled += 1
    } else {
      missingFields.push(field.label)
    }
  })

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 100
  const isComplete = percentage >= 75

  return {
    isComplete,
    percentage,
    filledCount: filled,
    missingCount: total - filled,
    missingFields,
  }
}
