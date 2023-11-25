import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONString } from '../../../../util/isJSONString'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minLengthValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minLength' in schema)) {
    return null
  }

  const minLength = schema['minLength']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    // count unicode characters, not UTF-16 code points
    const charactersCount = [...instance].length

    return assert(
      charactersCount >= minLength,
      minLength === 1
        ? `should have at least 1 character but has ${charactersCount} instead`
        : `should have at least ${minLength} characters but has ${charactersCount} instead`,
      { schemaLocation, schemaKeyword: 'minLength', instanceLocation }
    )
  }
}
