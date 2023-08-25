import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { formatList } from '../../../util/formatList'
import { isJSONArray } from '../../../util/isJSONArray'
import { assert } from '../../assert'
import { Output } from '../../output'
import { Validator } from '../../types'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function minContainsValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
): Validator {
  if (!('contains' in schema)) {
    return null
  }

  const minContains = schema['minContains']
  const contains = schema['contains']

  const containsValidator = schemaValidator(contains, `${schemaLocation}/minContains`, { cache, failFast })
  return (instance: any, instanceLocation: JSONPointer) => {
    if (!isJSONArray(instance)) {
      return { valid: true }
    }

    const results: { index: number; output: Output }[] = []
    for (let index = 0; index < instance.length; index++) {
      // TODO: read annotation from contains keyword intead of repeating validation
      const output = containsValidator(instance[index], `${instanceLocation}/${index}`)
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
      { schemaLocation, schemaKeyword: 'minContains', instanceLocation }
    )
  }
}
