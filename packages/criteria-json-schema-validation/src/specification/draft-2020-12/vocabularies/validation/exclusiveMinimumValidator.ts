import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { format } from '../../../../util/format'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function exclusiveMinimumValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('exclusiveMinimum' in schema)) {
    return null
  }

  const exclusiveMinimum = schema['exclusiveMinimum']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (instance > exclusiveMinimum) {
      return { valid: true, schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'exclusiveMinimum',
          instanceLocation,
          message: `should be greater than ${exclusiveMinimum} but is ${format(instance)} instead`
        }
      }
    }
  }
}
