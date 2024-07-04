import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { isJSONObject } from '../../../../util/isJSONObject'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maxPropertiesValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maxProperties' in schema)) {
    return null
  }

  const maxProperties = schema['maxProperties']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const count = Object.keys(instance).length

    if (count <= maxProperties) {
      return { valid: true, schemaLocation, schemaKeyword: 'maxProperties', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'maxProperties',
          instanceLocation,
          message:
            maxProperties === 1
              ? `should have up to 1 property but has ${count} instead`
              : `should have up to ${maxProperties} properties but has ${count} instead`
        }
      }
    }
  }
}
