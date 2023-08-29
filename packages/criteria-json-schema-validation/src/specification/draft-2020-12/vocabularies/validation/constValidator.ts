import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import circularEqual from '../../../../util/circularEqual'
import { InvalidOutput, Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/jsonValidator'

export function constValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('const' in schema)) {
    return null
  }

  const constValue = schema['const']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    const equal = circularEqual(instance, constValue)
    if (equal) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'const',
        instanceLocation,
        annotationResults: {
          const: `${instance} = ${constValue}`
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'const',
        instanceLocation,
        message: `Expected value to ${constValue} but found ${instance} instead`
      }
    }
  }
}
