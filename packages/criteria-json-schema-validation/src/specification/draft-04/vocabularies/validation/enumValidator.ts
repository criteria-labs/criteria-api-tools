import { DereferencedJSONSchemaDraft04 } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import circularEqual from '../../../../util/circularEqual'
import { formatList } from '../../../../util/formatList'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { Output } from '../../../../validation/Output'

export function enumValidator(
  schema: DereferencedJSONSchemaDraft04,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('enum' in schema)) {
    return null
  }

  const enumValues = schema['enum']
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    for (const enumValue of enumValues) {
      const equal = circularEqual(instance, enumValue)
      if (equal) {
        return { valid: true, schemaLocation, instanceLocation }
      }
    }

    let message
    if (enumValues.length === 0) {
      message = `Expected no value but found ${instance} instead`
    } else if (enumValues.length === 1) {
      message = `Expected ${enumValues[0]} but found ${instance} instead`
    } else {
      message = `Expected one of ${formatList(
        enumValues.map((value) => `${value}`),
        'or'
      )} but found ${instance} instead`
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
