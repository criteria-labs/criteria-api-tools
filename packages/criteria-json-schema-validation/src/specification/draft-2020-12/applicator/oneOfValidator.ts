import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function oneOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const oneOf = schema['oneOf']
  const validators = oneOf.map((subschema) =>
    schemaValidator(subschema, `${schemaLocation}/oneOf`, { cache, failFast })
  )
  return (instance: any, instanceLocation: JSONPointer) => {
    const outputs = validators.map((validator) => validator(instance, instanceLocation))
    return assert(
      outputs.filter((output) => output.valid).length === 1,
      `Expected value to validate against exactly one subschema`,
      { schemaLocation, schemaKeyword: 'oneOf', instanceLocation }
    )
  }
}
