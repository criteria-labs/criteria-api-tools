import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

const formatErrorMessage = (maxContains: number, indices: number[]) => {
  const maxContainsString = maxContains === 1 ? '1 item' : `${maxContains} items`
  const indicesString =
    indices.length === 1
      ? `${indices[0]}`
      : formatList(
          indices.map((index) => `${index}`),
          'and'
        )
  return `should have up to ${maxContainsString} that validate against subschema but has ${indices.length} at ${indicesString} instead`
}

export function maxContainsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('maxContains' in schema)) {
    return null
  }
  if (!('contains' in schema)) {
    return null
  }

  const maxContains = schema['maxContains']

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const containsAnnotationResult = annotationResults['contains'] // array of matched indices
    const count = Array.isArray(containsAnnotationResult) ? containsAnnotationResult.length : 0
    return assert(count <= maxContains, formatErrorMessage(maxContains, containsAnnotationResult), {
      schemaLocation,
      schemaKeyword: 'maxContains',
      instanceLocation
    })
  }
}
