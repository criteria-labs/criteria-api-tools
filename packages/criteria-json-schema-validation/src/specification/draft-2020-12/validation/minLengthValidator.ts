import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONString } from '../../../util/isJSONString'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function minLengthValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('minLength' in schema)) {
    return null
  }

  const minLength = schema['minLength']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONString(instance)) {
      return { valid: true }
    }

    const charactersCount = [...instance].length
    return assert(
      charactersCount >= minLength,
      `Expected string to contain at least ${minLength} characters but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'minLength', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
