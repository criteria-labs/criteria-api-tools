import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { jsonValidator } from './jsonValidator'

interface Options {
  failFast?: boolean
}

export function validateJSON(instance: unknown, schema: DereferencedJSONSchemaDraft04, options?: Options) {
  const validator = jsonValidator(schema, options)
  validator(instance)
}
