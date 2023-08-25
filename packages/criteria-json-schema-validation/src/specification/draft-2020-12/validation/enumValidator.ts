import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import circularEqual from '../../../util/circularEqual'
import { formatList } from '../../../util/formatList'
import { Cache } from '../cache/Cache'
import { Validator } from '../../types'

export function enumValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const enumValues = schema['enum']
  return (instance: any, instanceLocation: JSONPointer) => {
    for (const enumValue of enumValues) {
      const equal = circularEqual(instance, enumValue)
      if (equal) {
        return { valid: true }
      }
    }

    let error
    if (enumValues.length === 0) {
      error = `Expected no value but found ${instance} instead`
    } else if (enumValues.length === 1) {
      error = `Expected ${enumValues[0]} but found ${instance} instead`
    } else {
      error = `Expected one of ${formatList(
        enumValues.map((value) => `${value}`),
        'or'
      )} but found ${instance} instead`
    }
    return {
      valid: false,
      schemaLocation,
      schemaKeyword: 'enum',
      instanceLocation,
      error
    }
  }
}
