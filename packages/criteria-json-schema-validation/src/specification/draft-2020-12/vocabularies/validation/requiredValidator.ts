import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function requiredValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('required' in schema)) {
    return null
  }

  const required = schema['required']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const missingProperties = []
    for (const property of required) {
      if (!instance.hasOwnProperty(property)) {
        missingProperties.push(property)
      }
    }

    if (missingProperties.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'required',
        instanceLocation
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'required',
          instanceLocation,
          message: `is missing ${formatList(
            missingProperties.map((name) => `'${name}'`),
            'and'
          )}`
        }
      }
    }
  }
}
