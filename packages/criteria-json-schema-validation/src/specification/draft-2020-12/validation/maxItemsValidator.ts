import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function maxItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('maxItems' in schema)) {
    return null
  }

  const maxItems = schema['maxItems']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    return assert(
      instance.length <= maxItems,
      `Expected array to contain up to ${maxItems} items but found ${instance.length} instead`,
      { schemaLocation, schemaKeyword: 'maxItems', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
