import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'
import { allValidator } from '../compound/allValidator'

export function dependentRequiredValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('dependentRequired' in schema)) {
    return null
  }

  const dependentRequired = schema['dependentRequired']
  const propertyValidators: Validator[] = Object.entries(dependentRequired).map(([property, dependencies]) => {
    return (instance: any, instanceContext: InstanceContext): Output => {
      if (!instance.hasOwnProperty(property)) {
        return { valid: true }
      }

      const missingProperties = []
      for (const dependency of dependencies) {
        if (!instance.hasOwnProperty(dependency)) {
          missingProperties.push(dependency)
        }
      }

      return assert(
        missingProperties.length === 0,
        `Expected ${formatList(missingProperties, 'and')} to be defined when ${property} is defined`,
        { schemaLocation, schemaKeyword: 'dependentRequired', instanceLocation: instanceContext.instanceLocation }
      )
    }
  })

  const propertiesValidators = allValidator(propertyValidators, context)
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }
    return propertiesValidators(instance, instanceContext)
  }
}
