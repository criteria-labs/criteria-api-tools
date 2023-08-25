import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function notValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const not = schema['not']
  const validator = schemaValidator(not, `${schemaLocation}/not`, { cache, failFast })
  return (instance: unknown, instanceLocation: JSONPointer) => {
    const output = validator(instance, instanceLocation)
    return assert(!output.valid, `Expected value to fail validation against not schema`, {
      schemaLocation,
      schemaKeyword: 'not',
      instanceLocation
    })
  }
}
