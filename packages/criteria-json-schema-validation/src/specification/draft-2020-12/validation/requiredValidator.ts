import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function requiredValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const required = schema['required']
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const missingProperties = []
    for (const property of required) {
      if (!(property in instance)) {
        missingProperties.push(property)
      }
    }

    return assert(missingProperties.length === 0, `Expected ${formatList(missingProperties, 'and')} to be defined`, {
      schemaLocation,
      schemaKeyword: 'required',
      instanceLocation
    })
  }
}
