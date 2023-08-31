import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'

const formatErrorMessage = (minContains: number, indices: number[]) => {
  const minContainsString = minContains === 1 ? '1 item' : `${minContains} items`
  const indicesString =
    indices.length === 1
      ? `${indices[0]}`
      : formatList(
          indices.map((index) => `${index}`),
          'and'
        )
  return `should have at least ${minContainsString} that validate against subschema but has ${indices.length} at ${indicesString} instead`
}

export function minContainsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('minContains' in schema)) {
    return null
  }
  if (!('contains' in schema)) {
    return null
  }

  const minContains = schema['minContains']

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const containsAnnotationResult = annotationResults['contains'] // array of matched indices
    const count = Array.isArray(containsAnnotationResult) ? containsAnnotationResult.length : 0
    return assert(count >= minContains, formatErrorMessage(minContains, containsAnnotationResult), {
      schemaLocation,
      schemaKeyword: 'minContains',
      instanceLocation
    })
  }
}
