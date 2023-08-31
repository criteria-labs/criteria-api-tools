import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { formatList } from '../../../../util/formatList'
import { BoundValidator } from '../../../../validation/BoundValidator'

export function propertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('properties' in schema)) {
    return null
  }

  const properties = schema['properties']
  const propertyValidators: [string, BoundValidator][] = Object.keys(properties).map((propertyName) => {
    const subschema = properties[propertyName]
    const subschemaValidator = context.validatorForSchema(
      subschema,
      `${schemaLocation}/properties/${escapeReferenceToken(propertyName)}`
    )
    return [propertyName, subschemaValidator]
  })

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, subschemaValidator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = subschemaValidator(
        instance[propertyName],
        `${instanceLocation}/${escapeReferenceToken(propertyName)}`
      )
      if (output.valid) {
        validOutputs[propertyName] = output
      } else {
        invalidOutputs[propertyName] = output as InvalidOutput
      }

      if (!output.valid && failFast) {
        break
      }
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'properties',
        instanceLocation,
        annotationResults: {
          properties: Object.keys(validOutputs)
        }
      }
    } else {
      const entries = Object.keys(invalidOutputs)
      let message
      if (entries.length === 1) {
        message = `has invalid property ('${entries[0][0]}' ${entries[0][1]})`
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
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
