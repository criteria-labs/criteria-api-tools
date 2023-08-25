import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'
import { isJSONObject } from '../../../util/isJSONObject'

export function minPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const minProperties = schema['minProperties']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const count = Object.keys(instance).length
    return assert(
      count >= minProperties,
      `Expected object to contain at least ${minProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'minProperties', instanceLocation }
    )
  }
}
