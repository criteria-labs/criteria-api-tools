import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { JSONPointer } from '../../../../util/JSONPointer'
import { format } from '../../../../util/format'
import { isJSONString } from '../../../../util/isJSONString'
import { Output } from '../../../../validation/Output'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/keywordValidators'

export function patternValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('pattern' in schema)) {
    return null
  }

  const pattern = schema['pattern']
  const regexp = new RegExp(pattern)
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (!isJSONString(instance)) {
      return { valid: true, schemaLocation, instanceLocation }
    }

    return assert(instance.match(regexp), `should match '${pattern}' but is ${format(instance)} instead`, {
      schemaLocation,
      schemaKeyword: 'pattern',
      instanceLocation
    })
  }
}
