import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONString } from '../../../../util/isJSONString'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function patternValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('pattern' in schema)) {
    return null
  }

  const pattern = schema['pattern']
  const regexp = new RegExp(pattern)
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(instance.match(regexp), `Expected string to match '${pattern}' but found ${instance} instead`, {
      schemaLocation,
      schemaKeyword: 'pattern',
      instanceLocation
    })
  }
}
