import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'
import { isJSONArray } from '../../../util/isJSONArray'
import { Output, summarizedOutput } from '../../output'

export function itemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const items = schema['items']
  const validator = schemaValidator(items, `${schemaLocation}/items`, { cache, failFast })

  const prefixItems = schema['prefixItems'] ?? []
  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (let i = prefixItems.length ?? 0; i < instance.length; i++) {
      const output = validator(instance[i], `${instanceLocation}/${i}`)
      outputs.push(output)
    }
    return summarizedOutput(outputs)
  }
}
