import { JSONSchemaObject } from '@criteria/json-schema/draft-06'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, InvalidVerboseOutput, Output, ValidOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function propertyNamesValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('propertyNames' in schema)) {
    return null
  }

  const propertyNames = schema['propertyNames']
  const validator = context.validatorForSchema(propertyNames, [...schemaPath, `/propertyNames`])

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    const invalidPropertyNames: string[] = []
    const errors: InvalidOutput[] = []
    for (const propertyName of Object.keys(instance)) {
      // property names don't have a path from the root
      const output = validator(propertyName, '')
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        if (failFast) {
          if (outputFormat === 'flag') {
            return { valid: false }
          } else {
            return {
              valid: false,
              schemaLocation,
              schemaKeyword: 'propertyNames',
              instanceLocation,
              message: formatMessage([output as InvalidVerboseOutput], [propertyName]),
              errors: [output as InvalidVerboseOutput]
            }
          }
        }
        invalidPropertyNames.push(propertyName)
        errors.push(output as InvalidOutput)
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'propertyNames',
        instanceLocation
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'propertyNames',
          instanceLocation,
          message: formatMessage(errors as InvalidVerboseOutput[], invalidPropertyNames),
          errors: errors as InvalidVerboseOutput[]
        }
      }
    }
  }
}

export function formatMessage(errors: InvalidVerboseOutput[] | null, invalidPropertyNames: string[]) {
  let message
  if (invalidPropertyNames.length === 1) {
    message = `has an invalid property name ${invalidPropertyNames[0]}`
  } else {
    message = `has invalid property names ${formatList(
      invalidPropertyNames.map((propertyName) => `'${propertyName}'`),
      'and'
    )}`
  }
  if (errors !== null) {
    message += ` (${errors.map((error) => error.message).join('; ')})`
  }
  return message
}
