import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { InvalidOutput, Output } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function containsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const contains = schema['contains']
  const validator = schemaValidator(contains, `${schemaLocation}/contains`, { cache, failFast })
  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const outputs: InvalidOutput[] = []
    for (let index = 0; index < instance.length; index++) {
      const output = validator(instance[index], `${instanceLocation}/${index}`)
      if (output.valid) {
        return { valid: true }
      }
      outputs.push(output as InvalidOutput)
    }

    return {
      valid: false,
      error: 'Expected an array item to validate against subschema',
      errors: outputs
    }
  }
}
