import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { format } from '../../../../util/format'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maximumValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maximum' in schema)) {
    return null
  }

  const maximum = schema['maximum']
  const exclusiveMaximum = schema['exclusiveMaximum'] ?? false

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (exclusiveMaximum ? instance < maximum : instance <= maximum) {
      return { valid: true, schemaLocation, schemaKeyword: 'maximum', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'maximum',
          instanceLocation,
          message: `should be ${exclusiveMaximum ? 'less than' : 'less than or equal to'} ${maximum} but is ${format(
            instance
          )} instead`
        }
      }
    }
  }
}
