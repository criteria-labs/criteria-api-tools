import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function minPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('minProperties' in schema)) {
    return null
  }

  const minProperties = schema['minProperties']
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
