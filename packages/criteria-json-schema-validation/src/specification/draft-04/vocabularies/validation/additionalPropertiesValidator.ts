import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { formatList } from '../../../../util/formatList'

export function additionalPropertiesValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('additionalProperties' in schema)) {
    return null
  }

  const additionalProperties = schema['additionalProperties']
  const validator = context.validatorForSchema(additionalProperties, `${schemaLocation}/additionalProperties`)

  const properties = schema['properties'] ?? {}
  const expectedPropertyNames = Object.keys(properties)

  const patternProperties = schema['patternProperties'] ?? {}
  const expectedPatterns = Object.keys(patternProperties).map((pattern) => new RegExp(pattern))

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const validOutputs: { [name: string]: ValidOutput } = {}
    const invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (expectedPropertyNames.includes(propertyName)) {
        continue
      }
      if (expectedPatterns.some((regexp) => propertyName.match(regexp) !== null)) {
        continue
      }

      const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
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
      if (Object.keys(validOutputs).length > 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation,
          annotationResults: {
            additionalProperties: Object.keys(validOutputs)
          }
        }
      } else {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'additionalProperties',
        instanceLocation,
        message: `Found invalid additional properties ${formatList(Object.keys(invalidOutputs), 'and')}`,
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
