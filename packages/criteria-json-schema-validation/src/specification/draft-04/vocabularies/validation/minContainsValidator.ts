import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'

export function minContainsValidator(
  schema: DereferencedJSONSchemaDraft04,
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
    return assert(
      count >= minContains,
      `Expected at least ${minContains} array items to validate against subschema but found ${count} items at indices ${formatList(
        containsAnnotationResult.map((index) => `${index}`),
        'and'
      )} instead`,
      { schemaLocation, schemaKeyword: 'minContains', instanceLocation }
    )
  }
}
