import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function minContainsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('minContains' in schema)) {
    return null
  }
  if (!('contains' in schema)) {
    return null
  }

  const minContains = schema['minContains']
  const contains = schema['contains']

  const containsValidator = context.validatorForSchema(contains, `${schemaLocation}/minContains`)
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
        if (results.length >= minContains) {
          return { valid: true }
        }
      }
    }

    return assert(
      results.length >= minContains,
      `Expected at least ${minContains} array items to validate against subschema but found ${
        results.length
      } items at indices ${formatList(
        results.map((result) => `${result.index}`),
        'and'
      )} instead`,
      { schemaLocation, schemaKeyword: 'minContains', instanceLocation: instanceContext.instanceLocation }
    )
  }
}
