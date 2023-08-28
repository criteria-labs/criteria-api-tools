import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import circularEqual from '../../../util/circularEqual'
import { formatList } from '../../../util/formatList'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function uniqueItemsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('uniqueItems' in schema)) {
    return null
  }

  const uniqueItems = schema['uniqueItems']
  if (!uniqueItems) {
    return null
  }

  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
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
              instanceLocation: instanceContext.instanceLocation,
              error: `Expected array items to be unique but found equal items at positions ${i} and ${j} instead`
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
        instanceLocation: instanceContext.instanceLocation
      }
    )
  }
}
