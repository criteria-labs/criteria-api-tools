import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function maxLengthValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('maxLength' in schema)) {
    return null
  }

  const maxLength = schema['maxLength']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    const charactersCount = [...instance].length
    return assert(
      charactersCount <= maxLength,
      `Expected string to contain up to ${maxLength} characters but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxLength', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
