import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { isJSONString } from '../../../../util/isJSONString'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function maxLengthValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('maxLength' in schema)) {
    return null
  }

  const maxLength = schema['maxLength']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    // count unicode characters, not UTF-16 code points
    const charactersCount = [...instance].length

    if (charactersCount <= maxLength) {
      return { valid: true, schemaLocation, schemaKeyword: 'maxLength', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'maxLength',
          instanceLocation,
          message:
            maxLength === 1
              ? `should have up to 1 character but has ${instance.length} instead`
              : `should have up to ${maxLength} characters but has ${instance.length} instead`
        }
      }
    }
  }
}
