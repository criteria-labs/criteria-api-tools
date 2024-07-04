import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import { format } from '../../../../util/format'
import { isJSONString } from '../../../../util/isJSONString'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function patternValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('pattern' in schema)) {
    return null
  }

  const pattern = schema['pattern']
  const regexp = new RegExp(pattern)

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (regexp.test(instance)) {
      return { valid: true, schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'pattern',
          instanceLocation,
          message: `should match '${pattern}' but is ${format(instance)} instead`
        }
      }
    }
  }
}
