import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function propertiesValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('properties' in schema)) {
    return null
  }

  const properties = schema['properties']
  const propertyValidators: [string, BoundValidator][] = Object.keys(properties).map((propertyName) => {
    const subschema = properties[propertyName]
    const subschemaValidator = context.validatorForSchema(subschema, [
      ...schemaPath,
      `/properties/${escapeReferenceToken(propertyName)}`
    ])
    return [propertyName, subschemaValidator]
  })

  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, subschemaValidator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = subschemaValidator(
        instance[propertyName],
        `${instanceLocation}/${escapeReferenceToken(propertyName)}`
      )
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }

      if (!output.valid && failFast) {
        break
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation,
        annotationResults: {
          properties: Array.from(validOutputs.keys())
        }
      }
    } else {
      const entries = Array.from(invalidOutputs.entries())
      let message
      if (entries.length === 1) {
        message = `has invalid property ('${entries[0][0]}' ${entries[0][1].message})`
      } else {
        message = `has invalid properties (${formatList(
          entries.map((entry) => `'${entry[0]}' ${entry[1]}`),
          'and'
        )})`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation,
        message,
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
