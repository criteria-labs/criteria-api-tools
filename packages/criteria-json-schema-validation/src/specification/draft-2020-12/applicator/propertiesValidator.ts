import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { Output, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'
import { Validator } from '../../types'

export function propertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const properties = schema['properties']
  const propertyValidators: [string, Validator][] = Object.keys(properties).map((propertyName) => {
    const subschema = properties[propertyName]
    const subschemaValidator = schemaValidator(
      subschema,
      `${schemaLocation}/properties/${escapeReferenceToken(propertyName)}`,
      { cache, failFast }
    )
    return [propertyName, subschemaValidator]
  })

  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const outputs = []
    for (const [propertyName, subschemaValidator] of propertyValidators) {
      if (!(propertyName in instance)) {
        continue
      }

      const output = subschemaValidator(
        instance[propertyName],
        `${instanceLocation}/${escapeReferenceToken(propertyName)}`
      )
      if (!output.valid && failFast) {
        return output
      }
      outputs.push(output)
    }

    // Property didn't match name
    return summarizedOutput(outputs)
  }
}
