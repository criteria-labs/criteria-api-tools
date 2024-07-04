import { escapeReferenceToken, type JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { BoundValidator } from '../../../../validation/BoundValidator'
import {
  InvalidOutput,
  InvalidVerboseOutput,
  Output,
  ValidOutput,
  ValidVerboseOutput
} from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import { reduceAnnotationResults } from '../reduceAnnotationResults'

export function dependenciesValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('dependencies' in schema)) {
    return null
  }

  const dependencies = schema['dependencies']

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer

  const propertyValidators: [string, BoundValidator][] = Object.entries(dependencies).map(
    ([propertyName, dependentPropertiesOrSubschema]) => {
      if (Array.isArray(dependentPropertiesOrSubschema)) {
        if (outputFormat === 'flag') {
          const validator = (instance: unknown, instanceLocation: JSONPointer): Output => {
            const missingProperties = []
            for (const dependency of dependentPropertiesOrSubschema) {
              if (!instance.hasOwnProperty(dependency)) {
                if (failFast) {
                  return { valid: false }
                }
                missingProperties.push(dependency)
              }
            }
            return missingProperties.length === 0
              ? { valid: true, schemaLocation, schemaKeyword: 'dependencies', instanceLocation }
              : { valid: false }
          }
          return [propertyName, validator]
        } else {
          const validator = (instance: unknown, instanceLocation: JSONPointer): Output => {
            const missingProperties = []
            for (const dependency of dependentPropertiesOrSubschema) {
              if (!instance.hasOwnProperty(dependency)) {
                if (failFast) {
                  return {
                    valid: false,
                    schemaLocation,
                    schemaKeyword: 'dependencies',
                    instanceLocation,
                    message: `is missing ${dependency}`
                  }
                }
                missingProperties.push(dependency)
              }
            }
            return missingProperties.length === 0
              ? { valid: true, schemaLocation, schemaKeyword: 'dependencies', instanceLocation }
              : {
                  valid: false,
                  schemaLocation,
                  schemaKeyword: 'dependencies',
                  instanceLocation,
                  message: `is missing ${formatList(
                    missingProperties.map((missingProperty) => `'${missingProperty}'`),
                    'and'
                  )}`
                }
          }
          return [propertyName, validator]
        }
      } else {
        const subschemaValidator = context.validatorForSchema(dependentPropertiesOrSubschema, [
          ...schemaPath,
          `/dependencies/${escapeReferenceToken(propertyName)}`
        ])
        return [propertyName, subschemaValidator]
      }
    }
  )

  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    const errors: InvalidOutput[] = []
    for (const [propertyName, validator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = validator(instance, instanceLocation)
      if (!output.valid && failFast) {
        return output
      }

      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        errors.push(output as InvalidOutput)
      }
    }

    if (errors.length === 0) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        annotationResults: Array.from(validOutputs.values())
          .map((output) => (output as ValidVerboseOutput).annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'dependentSchemas',
          instanceLocation,
          message: formatList(
            errors.map((error) => (error as InvalidVerboseOutput).message),
            'and'
          ),
          errors: errors as InvalidVerboseOutput[]
        }
      }
    }
  }
}
