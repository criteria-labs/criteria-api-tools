import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function multipleOfValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('multipleOf' in schema)) {
    return null
  }

  const multipleOf = schema['multipleOf']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONNumber(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(
      multipleOf !== 0 ? Number.isInteger(instance / multipleOf) : false,
      `should be a multiple of ${multipleOf} but is ${instance} instead`,
      { schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
    )
  }
}
