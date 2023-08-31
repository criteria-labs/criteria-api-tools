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
            `Expected ${formatList(missingProperties, 'and')} to be defined when ${propertyName} is defined`,
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

    let validOutputs: { [name: string]: ValidOutput } = {}
    let invalidOutputs: { [name: string]: InvalidOutput } = {}
    for (const [propertyName, validator] of propertyValidators) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      const output = validator(instance, instanceLocation)
      if (output.valid) {
        validOutputs[propertyName] = output
      } else {
        invalidOutputs[propertyName] = output as InvalidOutput
      }

      if (!output.valid && failFast) {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'dependencies',
          instanceLocation,
          message: `Expected value to validate against dependent schema for property ${propertyName}`,
          errors: [output as InvalidOutput]
        }
      }
    }

    const valid = Object.keys(invalidOutputs).length === 0
    if (valid) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        annotationResults: Object.values(validOutputs)
          .map((output) => output.annotationResults ?? {})
          .reduce(reduceAnnotationResults, {})
      }
    } else {
      const propertyNames = Object.keys(invalidOutputs)
      let message
      if (propertyNames.length === 1) {
        message = `Expected value to validate against dependent schema for property ${propertyNames[0]}`
      } else {
        message = `Expected value to validate against dependent schema for properties ${formatList(
          propertyNames,
          'and'
        )}`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'dependentSchemas',
        instanceLocation,
        message,
        errors: Object.values(invalidOutputs)
      }
    }
  }
}
