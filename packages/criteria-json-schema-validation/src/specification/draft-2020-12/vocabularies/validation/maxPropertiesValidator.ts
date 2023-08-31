import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function maxPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('maxProperties' in schema)) {
    return null
  }

  const maxProperties = schema['maxProperties']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const count = Object.keys(instance).length
    return assert(
      count <= maxProperties,
      maxProperties === 1
        ? `should have up to 1 property but has ${count} instead`
        : `should have up to ${maxProperties} properties but has ${count} instead`,
      {
        schemaLocation,
        schemaKeyword: 'maxProperties',
        instanceLocation
      }
    )
  }
}
