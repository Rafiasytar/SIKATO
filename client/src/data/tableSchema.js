import { defaultFormQuestions } from './formQuestions.js'
import { buildSchemaFromQuestions } from '../utils/formSchema.js'

export const fixedTableSchema = buildSchemaFromQuestions(defaultFormQuestions)
