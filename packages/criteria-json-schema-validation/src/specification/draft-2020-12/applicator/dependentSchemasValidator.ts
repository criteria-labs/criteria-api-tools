import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { Cache } from '../cache/Cache'
import { allValidator } from '../compound/allValidator'
import { schemaValidator } from '../schema/schemaValidator'
import { Validator } from '../../types'
import { isJSONObject } from '../../../util/isJSONObject'
import { escapeReferenceToken } from '@criteria/json-pointer'
import { assert } from '../../assert'

export function dependentSchemasValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  const dependentSchemas = schema['dependentSchemas']

  const propertyValidators: Validator[] = Object.entries(dependentSchemas).map(([property, subschema]) => {
    const subschemaValidator = schemaValidator(
      subschema,
      `${schemaLocation}/dependentSchemas/${escapeReferenceToken(property)}`,
      { cache, failFast }
    )

    return (instance: any, instanceLocation: JSONPointer) => {
      if (!(property in instance)) {
        return { valid: true }
      }

      const output = subschemaValidator(instance, instanceLocation)
      return assert(output.valid, `Expected value to validate against dependent schema when ${property} is defined`, {
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation
      })
    }
  })

  const propertiesValidators = allValidator(propertyValidators, { failFast })
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }
    return propertiesValidators(instance, instanceLocation)
  }
}
