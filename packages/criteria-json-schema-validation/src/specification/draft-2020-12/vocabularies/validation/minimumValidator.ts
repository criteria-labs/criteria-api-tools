import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { format } from '../../../../util/format'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minimumValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minimum' in schema)) {
    return null
  }

  const minimum = schema['minimum']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const valid = instance >= minimum
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
          message: `should be greater than or equal to ${minimum} but is ${format(instance)} instead`
        }
      }
    }
  }
}
