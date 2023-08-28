import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { Output } from '../../output'

export function maxPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('maxProperties' in schema)) {
    return null
  }

  const maxProperties = schema['maxProperties']
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const count = Object.keys(instance).length
    return assert(
      count <= maxProperties,
      `Expected object to contain up to ${maxProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'maxProperties', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
