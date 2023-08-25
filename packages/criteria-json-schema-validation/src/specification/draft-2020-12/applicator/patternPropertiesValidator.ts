import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { Output, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'
import { Validator } from '../../types'

export function patternPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const patternProperties = schema['patternProperties']
  const patternValidators: [string, RegExp, Validator][] = Object.keys(patternProperties).map((pattern) => {
    const regexp = new RegExp(pattern)
    const subschema = patternProperties[pattern]
    const subschemaValidator = schemaValidator(
      subschema,
      `${schemaLocation}/patternProperties/${escapeReferenceToken(pattern)}`,
      { cache, failFast }
    )
    return [pattern, regexp, subschemaValidator]
  })

  const properties = schema['properties']
  const expectedPropertyNames = Object.keys(properties)

  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (expectedPropertyNames.includes(propertyName)) {
        continue
      }

      for (const [pattern, regexp, validator] of patternValidators) {
        // what if multiple patterns match the property?

        if (propertyName.match(regexp) === null) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (!output.valid && failFast) {
          return output
        }
        outputs.push(output)
      }

      // Property didn't match name or pattern
    }
    return summarizedOutput(outputs)
  }
}
