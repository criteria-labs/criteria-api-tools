import { DereferencedJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { jsonValidator } from './jsonValidator'

interface Options {
  failFast?: boolean
}

export function validateJSON(instance: unknown, schema: DereferencedJSONSchemaDraft2020_12, options?: Options) {
  const validator = jsonValidator(schema, options)
  validator(instance)
}
