import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import circularEqual from '../../../util/circularEqual'
import { Output } from '../../output'
import { Validator } from '../../types'
import { InstanceContext } from '../InstanceContext'
import { ValidationContext } from '../ValidationContext'

export function constValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidationContext
): Validator {
  if (!('const' in schema)) {
    return null
  }

  const constValue = schema['const']
  return (instance: any, instanceContext: InstanceContext): Output => {
    const equal = circularEqual(instance, constValue)
    if (equal) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'const',
        instanceLocation: instanceContext.instanceLocation,
        annotationResults: {
          const: `${instance} = ${constValue}`
        }
      }
    } else {
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'const',
        instanceLocation: instanceContext.instanceLocation,
        error: `Expected value to ${constValue} but found ${instance} instead`
      }
    }
  }
}
