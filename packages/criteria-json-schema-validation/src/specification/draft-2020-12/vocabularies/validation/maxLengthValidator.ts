import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONString } from '../../../../util/isJSONString'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function maxLengthValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('maxLength' in schema)) {
    return null
  }

  const maxLength = schema['maxLength']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    // count unicode characters, not UTF-16 code points
    const charactersCount = [...instance].length

    return assert(
      charactersCount <= maxLength,
      `Expected string to contain up to ${maxLength} characters but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxLength', instanceLocation }
    )
  }
}
