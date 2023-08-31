import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { formatList } from '../../../../util/formatList'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { BoundValidator } from '../../../../validation/BoundValidator'

export function patternPropertiesValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('patternProperties' in schema)) {
    return null
  }

  const patternProperties = schema['patternProperties']
  const patternValidators: [string, RegExp, BoundValidator][] = Object.keys(patternProperties).map((pattern) => {
    const regexp = new RegExp(pattern)
    const subschema = patternProperties[pattern]
    const subschemaValidator = context.validatorForSchema(
      subschema,
      `${schemaLocation}/patternProperties/${escapeReferenceToken(pattern)}`
    )
    return [pattern, regexp, subschemaValidator]
  })

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, propertyValue] of Object.entries(instance)) {
      for (const [pattern, regexp, validator] of patternValidators) {
        // what if multiple patterns match the property?

        if (propertyName.match(regexp) === null) {
          continue
        }

        const output = validator(propertyValue, `${instanceLocation}/${escapeReferenceToken(propertyName)}`)
        if (output.valid) {
          validOutputs[propertyName] = output
        } else {
          invalidOutputs[propertyName] = output as InvalidOutput
        }

        if (!output.valid && failFast) {
          return {
            valid: false,
            schemaLocation,
            schemaKeyword: 'patternProperties',
            instanceLocation,
            message: `Invalid property ${propertyName}`,
            errors: [output as InvalidOutput]
          }
        }
      }

      // Property didn't match name or pattern
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        annotationResults: {
          patternProperties: Object.keys(validOutputs)
        }
      }
    } else {
      const propertyNames = Object.keys(invalidOutputs)
      let message
      if (propertyNames.length === 1) {
        message = `Invalid property ${propertyNames[0]}`
      } else {
        message = `Invalid properties ${formatList(propertyNames, 'and')}`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'patternProperties',
        instanceLocation,
        message,
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
