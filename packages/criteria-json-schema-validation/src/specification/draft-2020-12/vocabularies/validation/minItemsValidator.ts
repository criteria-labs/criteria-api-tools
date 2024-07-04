import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { isJSONArray } from '../../../../util/isJSONArray'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minItemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minItems' in schema)) {
    return null
  }

  const minItems = schema['minItems']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (instance.length >= minItems) {
      return { valid: true, schemaLocation, schemaKeyword: 'minItems', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'minItems',
          instanceLocation,
          message:
            minItems === 1
              ? `should have at least 1 item but has ${instance.length} instead`
              : `should have at least ${minItems} items but has ${instance.length} instead`
        }
      }
    }
  }
}
