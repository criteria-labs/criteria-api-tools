import { JSONSchema } from '@criteria/json-schema/draft-04'
import { JSONPointer } from '../../../../util/JSONPointer'
import circularEqual from '../../../../util/circularEqual'
import { format } from '../../../../util/format'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function constValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('const' in schema)) {
    return null
  }

  const constValue = schema['const']
  const schemaLocation = schemaPath.join('') as JSONPointer
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
        message: `should be ${format(constValue)} but is ${format(instance)} instead`
      }
    }
  }
}
