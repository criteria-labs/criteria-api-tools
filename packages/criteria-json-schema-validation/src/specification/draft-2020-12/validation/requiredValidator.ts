import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function requiredValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('required' in schema)) {
    return null
  }

  const required = schema['required']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const missingProperties = []
    for (const property of required) {
      if (!instance.hasOwnProperty(property)) {
        missingProperties.push(property)
      }
    }

    return assert(missingProperties.length === 0, `Expected ${formatList(missingProperties, 'and')} to be defined`, {
      schemaLocation,
      schemaKeyword: 'required',
      instanceLocation: instanceContext.instanceLocation
    })
  }
}
