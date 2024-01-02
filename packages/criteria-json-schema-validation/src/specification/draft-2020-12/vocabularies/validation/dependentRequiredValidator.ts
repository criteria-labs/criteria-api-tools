import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONObject } from '../../../../util/isJSONObject'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function dependentRequiredValidator(
  schema: JSONSchemaObject,
  schemaPath: JSONPointer[],
  context: ValidatorContext
) {
  if (!('dependentRequired' in schema)) {
    return null
  }

  const dependentRequired = schema['dependentRequired']

  const outputFormat = context.outputFormat
  const failFast = context.failFast
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    const missingProperties = []
    for (const [propertyName, dependencies] of Object.entries(dependentRequired)) {
      if (!instance.hasOwnProperty(propertyName)) {
        continue
      }

      for (const dependency of dependencies) {
        if (!instance.hasOwnProperty(dependency)) {
          if (failFast) {
            if (outputFormat === 'flag') {
              return { valid: false }
            } else {
              return {
                valid: false,
                schemaLocation,
                schemaKeyword: 'dependentRequired',
                instanceLocation,
                message: `is missing '${dependency}'`
              }
            }
          }
          missingProperties.push(dependency)
        }
      }
    }

    if (missingProperties.length === 0) {
      return { valid: true, schemaLocation, schemaKeyword: 'dependentRequired', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'dependentRequired',
          instanceLocation,
          message: `is mising ${formatList(
            missingProperties.map((missingProperty) => `'${missingProperty}'`),
            'and'
          )}`
        }
      }
    }
  }
}
