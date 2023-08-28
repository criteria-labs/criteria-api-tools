import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function minPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('minProperties' in schema)) {
    return null
  }

  const minProperties = schema['minProperties']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const count = Object.keys(instance).length
    return assert(
      count >= minProperties,
      `Expected object to contain at least ${minProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'minProperties', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
