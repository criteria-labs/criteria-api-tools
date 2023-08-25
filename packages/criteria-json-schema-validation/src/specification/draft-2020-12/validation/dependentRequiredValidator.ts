import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Cache } from '../cache/Cache'
import { allValidator } from '../compound/allValidator'
import { Validator } from '../../types'

export function dependentRequiredValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const dependentRequired = schema['dependentRequired']
  const propertyValidators: Validator[] = Object.entries(dependentRequired).map(([property, dependencies]) => {
    return (instance: any, instanceLocation: JSONPointer) => {
      if (!(property in instance)) {
        return { valid: true }
      }

      const missingProperties = []
      for (const dependency of dependencies) {
        if (!(dependency in instance)) {
          missingProperties.push(dependency)
        }
      }

      return assert(
        missingProperties.length === 0,
        `Expected ${formatList(missingProperties, 'and')} to be defined when ${property} is defined`,
        { schemaLocation, schemaKeyword: 'dependentRequired', instanceLocation }
      )
    }
  })

  const propertiesValidators = allValidator(propertyValidators, { failFast })
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONObject(Object)) {
      return { valid: true }
    }
    return propertiesValidators(instance, instanceLocation)
  }
}
