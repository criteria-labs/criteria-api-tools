import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchema } from '@criteria/json-schema/draft-04'
import equal from 'fast-deep-equal'
import { format } from '../../../../util/format'
import { formatList } from '../../../../util/formatList'
import { Output } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function enumValidator(schema: JSONSchema, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('enum' in schema)) {
    return null
  }

  const enumValues = schema['enum']

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    for (const enumValue of enumValues) {
      if (equal(instance, enumValue)) {
        return { valid: true, schemaLocation, instanceLocation }
      }
    }

    if (outputFormat === 'flag') {
      return { valid: false }
    } else {
      let message
      if (enumValues.length === 0) {
        message = `should not be defined but is ${format(instance)} instead`
      } else if (enumValues.length === 1) {
        message = `should be ${format(enumValues[0])} but is ${format(instance)} instead`
      } else {
        message = `should be one of ${formatList(
          enumValues.map((value) => format(value)),
          'or'
        )} but is ${format(instance)} instead`
      }
      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'enum',
        instanceLocation,
        message
      }
    }
  }
}
