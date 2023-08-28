import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function minItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('minItems' in schema)) {
    return null
  }

  const minItems = schema['minItems']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length >= minItems,
      `Expected array to contain at least ${minItems} items but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'minItems', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
