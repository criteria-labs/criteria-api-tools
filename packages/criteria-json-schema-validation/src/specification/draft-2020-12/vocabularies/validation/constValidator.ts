import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { format } from '../../../../util/format'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'
import equal from 'fast-deep-equal'

export function constValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('const' in schema)) {
    return null
  }

  const constValue = schema['const']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (equal(instance, constValue)) {
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
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'const',
          instanceLocation,
          message: `should be ${format(constValue)} but is ${format(instance)} instead`
        }
      }
    }
  }
}
