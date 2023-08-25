import { DereferencedJSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Cache } from './cache/Cache'
import { schemaValidator } from './schema/schemaValidator'

export function jsonValidator(schema: DereferencedJSONSchemaDraft2020_12, { failFast }: { failFast: boolean }) {
  const cache = new Cache()
  const validator = schemaValidator(schema, '', { cache, failFast })
  return (instance: unknown) => {
    const output = validator(instance, '')
    if (!output.valid) {
      throw new Error('Invalid JSON')
    }
  }
}
