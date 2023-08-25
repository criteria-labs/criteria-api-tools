import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { InvalidOutput, Output, ValidOutput, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function anyOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const anyOf = schema['anyOf']
  const validators = anyOf.map((subschema) =>
    schemaValidator(subschema, `${schemaLocation}/anyOf`, { cache, failFast })
  )
  return (instance: any, instanceLocation: JSONPointer): Output => {
    const invalidOutputs: InvalidOutput[] = []
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const output = validator(instance, instanceLocation)
      if (output.valid) {
        return { valid: true }
      }
      invalidOutputs.push(output as InvalidOutput)
    }

    return summarizedOutput(invalidOutputs)
  }
}
