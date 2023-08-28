import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { InvalidOutput, Output } from '../../output'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function additionalPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
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
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const outputs: { [name: string]: Output } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      if (expectedPropertyNames.includes(propertyName)) {
        continue
      }
      if (expectedPatterns.some((regexp) => propertyName.match(regexp) !== null)) {
        continue
      }

      const output = validator(
        propertyValue,
        instanceContext.appendingInstanceLocation(`/${escapeReferenceToken(propertyName)}`)
      )
      outputs[propertyName] = output

      if (!output.valid && failFast) {
        break
      }
    }

    const invalidOutputs = Object.values(outputs).filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      if (Object.keys(outputs).length > 0) {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation: instanceContext.instanceLocation,
          annotationResults: {
            additionalProperties: Object.keys(outputs)
          }
        }
      } else {
        return {
          valid: true,
          schemaLocation,
          schemaKeyword: 'additionalProperties',
          instanceLocation: instanceContext.instanceLocation
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'additionalProperties',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}