import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function minPropertiesValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minProperties' in schema)) {
    return null
  }

  const minProperties = schema['minProperties']
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const count = Object.keys(instance).length
    return assert(
      count >= minProperties,
      minProperties === 1
        ? `should have at least 1 property but has ${count} instead`
        : `should have at least ${minProperties} properties but has ${count} instead`,
      {
        schemaLocation,
        schemaKeyword: 'minProperties',
        instanceLocation
      }
    )
  }
}
