import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { Output, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function additionalPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const additionalProperties = schema['additionalProperties']
  const validator = schemaValidator(additionalProperties, `${schemaLocation}/additionalProperties`, { cache, failFast })

  const properties = schema['properties'] ?? {}
  const expectedPropertyNames = Object.keys(properties)

  const patternProperties = schema['patternProperties'] ?? {}
  const expectedPatterns = Object.keys(patternProperties).map((pattern) => new RegExp(pattern))

  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const additionalEntries = Object.entries(instance).filter(([propertyName, propertyValue]) => {
      return (
        !expectedPropertyNames.includes(propertyName) &&
        !expectedPatterns.some((regexp) => propertyName.match(regexp) !== null)
      )
    })

    const outputs = []
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (expectedPropertyNames.includes(propertyName)) {
        continue
      }
      if (expectedPatterns.some((regexp) => propertyName.match(regexp) !== null)) {
        continue
      }

      const output = validator(propertyValue, `${instanceLocation}/${propertyName}`)
      outputs.push(output)
      if (!output.valid && failFast) {
        return output
      }
    }
    return summarizedOutput(outputs)
  }
}
