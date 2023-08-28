import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { assert } from '../../assert'
import { Validator } from '../../types'
import { ValidationContext } from '../ValidationContext'
import { allValidator } from '../compound/allValidator'
import { InstanceContext } from '../InstanceContext'
import { Output } from '../../output'

export function dependentSchemasValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('dependentSchemas' in schema)) {
    return null
  }

  const dependentSchemas = schema['dependentSchemas']

  const propertyValidators: Validator[] = Object.entries(dependentSchemas).map(([property, subschema]) => {
    const subschemaValidator = context.validatorForSchema(
      subschema,
      `${schemaLocation}/dependentSchemas/${escapeReferenceToken(property)}`
    )

    return (instance: any, instanceContext: InstanceContext): Output => {
      if (!instance.hasOwnProperty(property)) {
        return { valid: true }
      }

      const output = subschemaValidator(instance, instanceContext)
      return assert(output.valid, `Expected value to validate against dependent schema when ${property} is defined`, {
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation: instanceContext.instanceLocation
      })
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
