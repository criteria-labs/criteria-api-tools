import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import equal from 'fast-deep-equal'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { FlagOutput, VerboseOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function uniqueItemsValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('uniqueItems' in schema)) {
    return null
  }

  const uniqueItems = schema['uniqueItems']
  if (!uniqueItems) {
    return null
  }

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (
    instance: any,
    instanceLocation: JSONPointer,
    annotationResults: Record<string, any>
  ): FlagOutput | VerboseOutput => {
    if (!isJSONArray(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const matchingPairs: [number, number][] = []
    for (let i = 0; i < instance.length; i++) {
      for (let j = i + 1; j < instance.length; j++) {
        if (equal(instance[i], instance[j])) {
          if (failFast) {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'uniqueItems',
              instanceLocation,
              message: `should have unique items but items at ${i} and ${j} are equal instead`
            }
          }
          matchingPairs.push([i, j])
        }
      }
    }

    if (matchingPairs.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'uniqueItems',
        instanceLocation
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'uniqueItems',
          instanceLocation,
          message: `should have unique items but ${formatList(
            matchingPairs.map((pair) => `items at ${pair[0]} and ${pair[1]} are equal`),
            'and'
          )} instead`
        }
      }
    }
  }
}
