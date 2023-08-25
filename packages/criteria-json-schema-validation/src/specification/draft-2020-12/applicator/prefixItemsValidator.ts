import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { Output, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function prefixItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const prefixItems = schema['prefixItems']
  const prefixItemValidators = prefixItems.map((subschema, i) =>
    schemaValidator(subschema, `${schemaLocation}/prefixItems/${i}`, { cache, failFast })
  )

  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (let i = 0; i < instance.length && i < prefixItemValidators.length; i++) {
      const validator = prefixItemValidators[i]
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      outputs.push(output)
    }
    return summarizedOutput(outputs)
  }
}
