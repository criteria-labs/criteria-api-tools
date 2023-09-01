import { escapeReferenceToken } from '@criteria/json-pointer'
import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { InvalidOutput, Output, ValidOutput } from '../../../../validation/Output'
import { reduceAnnotationResults } from '../reduceAnnotationResults'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { BoundValidator } from '../../../../validation/BoundValidator'
import { assert } from '../../../../validation/assert'

export function dependenciesValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('dependencies' in schema)) {
    return null
  }

  const dependencies = schema['dependencies']

  const propertyValidators: [string, BoundValidator][] = Object.entries(dependencies).map(
    ([propertyName, dependentPropertiesOrSubschema]) => {
      if (Array.isArray(dependentPropertiesOrSubschema)) {
        const validator = (instance: unknown, instanceLocation: JSONPointer): Output => {
          const missingProperties = []
          for (const dependency of dependentPropertiesOrSubschema) {
            if (!instance.hasOwnProperty(dependency)) {
              missingProperties.push(dependency)
            }
          }
          return assert(
            missingProperties.length === 0,
            `is missing ${formatList(
              missingProperties.map((missingProperty) => `'${missingProperty}'`),
              'and'
            )}`,
            { schemaLocation, schemaKeyword: 'dependencies', instanceLocation }
          )
        }
        return [propertyName, validator]
      } else {
        const subschemaValidator = context.validatorForSchema(
          dependentPropertiesOrSubschema,
          `${schemaLocation}/dependencies/${escapeReferenceToken(propertyName)}`
        )
        return [propertyName, subschemaValidator]
      }
    }
  )

  const failFast = context.failFast
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    let validOutputs = new Map<string, ValidOutput>()
    let invalidOutputs = new Map<string, InvalidOutput>()
    for (const [propertyName, validator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = validator(instance, instanceLocation)
      if (output.valid) {
        validOutputs.set(propertyName, output)
      } else {
        invalidOutputs.set(propertyName, output as InvalidOutput)
      }

      if (!output.valid && failFast) {
        return output
      }
    }

    const valid = invalidOutputs.size === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        annotationResults: Array.from(validOutputs.values())
          .map((output) => output.annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        message: formatList(
          Array.from(invalidOutputs.values()).map((output) => output.message),
          'and'
        ),
        errors: Array.from(invalidOutputs.values())
      }
    }
  }
}
