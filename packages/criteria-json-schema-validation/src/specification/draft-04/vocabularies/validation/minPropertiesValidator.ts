import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function minPropertiesValidator(
  schema: DereferencedJSONSchemaDraft04,
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
      `Expected object to contain at least ${minProperties} properties but found ${count} instead`,
      { schemaLocation, schemaKeyword: 'minProperties', instanceLocation }
    )
  }
}
