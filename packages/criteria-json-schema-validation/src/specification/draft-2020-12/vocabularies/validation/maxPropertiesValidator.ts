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
      `Expected object to contain up to ${maxProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'maxProperties', instanceLocation }
    )
  }
}
