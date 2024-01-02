import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { format } from '../../../../util/format'

export function minimumValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minimum' in schema)) {
    return null
  }

  const minimum = schema['minimum']
  const exclusiveMinimum = schema['exclusiveMinimum'] ?? false

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const valid = exclusiveMinimum ? instance > minimum : instance >= minimum
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'minimum',
        instanceLocation
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'minimum',
          instanceLocation,
          message: `should be ${
            exclusiveMinimum ? 'greater than' : 'greater than or equal to'
          } ${minimum} but is ${format(instance)} instead`
        }
      }
    }
  }
}
