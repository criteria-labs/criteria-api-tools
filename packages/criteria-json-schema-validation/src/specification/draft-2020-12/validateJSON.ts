import { DereferencedJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { jsonValidator } from './jsonValidator'

export function validateJSON(
  instance: unknown,
  schema: DereferencedJSONSchemaDraft2020_12,
  { failFast }: { failFast: boolean }
) {
  const validator = jsonValidator(schema, { failFast })
  validator(instance)
}
