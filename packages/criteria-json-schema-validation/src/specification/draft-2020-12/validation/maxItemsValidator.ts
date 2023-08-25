import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function maxItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const maxItems = schema['maxItems']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length <= maxItems,
      `Expected array to contain up to ${maxItems} items but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxItems', instanceLocation }
    )
  }
}
