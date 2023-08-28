import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { InvalidOutput, Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function patternPropertiesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
) {
  if (!('patternProperties' in schema)) {
    return null
  }

  const patternProperties = schema['patternProperties']
  const patternValidators: [string, RegExp, Validator][] = Object.keys(patternProperties).map((pattern) => {
    const regexp = new RegExp(pattern)
    const subschema = patternProperties[pattern]
    const subschemaValidator = context.validatorForSchema(
      subschema,
      `${schemaLocation}/patternProperties/${escapeReferenceToken(pattern)}`
    )
    return [pattern, regexp, subschemaValidator]
  })

  const failFast = context.failFast
  return (instance: any, instanceContext: InstanceContext): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    const outputs: { [name: string]: Output } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      for (const [pattern, regexp, validator] of patternValidators) {
        // what if multiple patterns match the property?

        if (propertyName.match(regexp) === null) {
          continue
        }

        const output = validator(
          propertyValue,
          instanceContext.appendingInstanceLocation(`/${escapeReferenceToken(propertyName)}`)
        )
        outputs[propertyName] = output

        if (!output.valid && failFast) {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'patternProperties',
            instanceLocation: instanceContext.instanceLocation,
            errors: [output as InvalidOutput]
          }
        }
      }

      // Property didn't match name or pattern
    }

    const invalidOutputs = Object.values(outputs).filter((output) => !output.valid) as InvalidOutput[]
    const valid = invalidOutputs.length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          patternProperties: Object.keys(outputs)
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation: instanceContext.instanceLocation,
        errors: invalidOutputs
      }
    }
  }
}
