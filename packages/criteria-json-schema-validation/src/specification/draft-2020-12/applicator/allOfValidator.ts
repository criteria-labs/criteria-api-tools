import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function allOfValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const allOf = schema['allOf']
  const validators = allOf.map((subschema) =>
    schemaValidator(subschema, `${schemaLocation}/allOf`, { cache, failFast })
  )
  return (instance: any, instanceLocation: JSONPointer) => {
    const outputs = []
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const output = validator(instance, instanceLocation)
      outputs.push(output)
      if (!output.valid && failFast) {
        return output
      }
    }
    return summarizedOutput(outputs)
  }
}
