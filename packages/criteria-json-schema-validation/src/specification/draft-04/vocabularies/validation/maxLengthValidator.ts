import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONString } from '../../../../util/isJSONString'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maxLengthValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maxLength' in schema)) {
    return null
  }

  const maxLength = schema['maxLength']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    // count unicode characters, not UTF-16 code points
    const charactersCount = [...instance].length

    return assert(
      charactersCount <= maxLength,
      maxLength === 1
        ? `should have up to 1 character but has ${instance.length} instead`
        : `should have up to ${maxLength} characters but has ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxLength', instanceLocation }
    )
  }
}
