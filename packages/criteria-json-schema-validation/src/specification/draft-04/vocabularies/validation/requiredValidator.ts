import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function requiredValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('required' in schema)) {
    return null
  }

  const required = schema['required']
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

    return assert(
      missingProperties.length === 0,
      `is missing ${formatList(
        missingProperties.map((name) => `'${name}'`),
        'and'
      )}`,
      {
        schemaLocation,
        schemaKeyword: 'required',
        instanceLocation
      }
    )
  }
}
