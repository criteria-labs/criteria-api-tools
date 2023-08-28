import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function maxContainsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('maxContains' in schema)) {
    return null
  }
  if (!('contains' in schema)) {
    return null
  }

  const maxContains = schema['maxContains']
  const contains = schema['contains']

  const containsValidator = context.validatorForSchema(contains, `${schemaLocation}/maxContains`)
  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const results: { index: number; output: Output }[] = []
    for (let index = 0; index < instance.length; index++) {
      // TODO: read annotation from contains keyword intead of repeating validation
      const output = containsValidator(instance[index], instanceContext.appendingInstanceLocation(`/${index}`))
      if (output.valid) {
        results.push({ index, output })
        if (results.length > maxContains && failFast) {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'maxContains',
            instanceLocation: instanceContext.instanceLocation,
            error: `Expected up to ${maxContains} array items to validate against subschema but found at least ${
              results.length
            } items at indices ${formatList(
              results.map((result) => `${result.index}`),
              'and'
            )} instead`
          }
        }
      }
    }

    return assert(
      results.length <= maxContains,
      `Expected up to ${maxContains} array items to validate against subschema but found ${
        results.length
      } items at indices ${formatList(
        results.map((result) => `${result.index}`),
        'and'
      )} instead`,
      { schemaLocation, schemaKeyword: 'maxContains', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
