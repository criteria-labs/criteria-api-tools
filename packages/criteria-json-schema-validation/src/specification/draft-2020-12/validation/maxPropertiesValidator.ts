import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'
import { isJSONObject } from '../../../util/isJSONObject'

export function maxPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const maxProperties = schema['maxProperties']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const count = Object.keys(instance).length
    return assert(
      count <= maxProperties,
      `Expected object to contain up to ${maxProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'maxProperties', instanceLocation }
    )
  }
}
