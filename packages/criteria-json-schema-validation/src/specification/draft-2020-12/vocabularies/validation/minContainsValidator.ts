import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

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

export function minContainsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('minContains' in schema)) {
    return null
  }
  if (!('contains' in schema)) {
    return null
  }

  const minContains = schema['minContains']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const containsAnnotationResult = annotationResults['contains'] // array of matched indices
    const count = Array.isArray(containsAnnotationResult) ? containsAnnotationResult.length : 0
    if (count >= minContains) {
      return { valid: true, schemaLocation, schemaKeyword: 'contains', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'contains',
          instanceLocation,
          message: formatErrorMessage(minContains, containsAnnotationResult ?? [])
        }
      }
    }
  }
}
