import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { isJSONArray } from '../../../../util/isJSONArray'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maxItemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maxItems' in schema)) {
    return null
  }

  const maxItems = schema['maxItems']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (instance.length <= maxItems) {
      return { valid: true, schemaLocation, schemaKeyword: 'maxItems', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'maxItems',
          instanceLocation,
          message:
            maxItems === 1
              ? `should have up to 1 item but has ${instance.length} instead`
              : `should have up to ${maxItems} items but has ${instance.length} instead`
        }
      }
    }
  }
}
