import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function minItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const minItems = schema['minItems']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length >= minItems,
      `Expected array to contain at least ${minItems} items but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'minItems', instanceLocation }
    )
  }
}
