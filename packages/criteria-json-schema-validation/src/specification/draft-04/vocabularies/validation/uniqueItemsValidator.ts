import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import circularEqual from '../../../../util/circularEqual'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function uniqueItemsValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('uniqueItems' in schema)) {
    return null
  }

  const uniqueItems = schema['uniqueItems']
  if (!uniqueItems) {
    return null
  }

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const matchingPairs: [number, number][] = []
    for (let i = 0; i < instance.length; i++) {
      for (let j = i + 1; j < instance.length; j++) {
        const equal = circularEqual(instance[i], instance[j])
        if (equal) {
          if (failFast) {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'uniqueItems',
              instanceLocation,
              message: `Expected array items to be unique but found equal items at positions ${i} and ${j} instead`
            }
          }
          matchingPairs.push([i, j])
        }
      }
    }

    return assert(
      matchingPairs.length === 0,
      `Expected array items to be unique but found matching pairs ${formatList(
        matchingPairs.map((pair) => `[${pair[0]}, ${pair[1]}]`),
        'and'
      )} instead`,
      {
        schemaLocation,
        schemaKeyword: 'uniqueItems',
        instanceLocation
      }
    )
  }
}
