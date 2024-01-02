import { JSONSchemaObject } from '@criteria/json-schema/draft-06'
import { JSONPointer } from '../../../../util/JSONPointer'
import { format } from '../../../../util/format'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function exclusiveMaximumValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('exclusiveMaximum' in schema)) {
    return null
  }

  const exclusiveMaximum = schema['exclusiveMaximum']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (instance < exclusiveMaximum) {
      return { valid: true, schemaLocation, schemaKeyword: 'exclusiveMaximum', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'exclusiveMaximum',
          instanceLocation,
          message: `should be less than ${exclusiveMaximum} but is ${format(instance)} instead`
        }
      }
    }
  }
}
