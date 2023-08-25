import { DereferencedJSONSchemaObjectDraft2020_12 } from '@criteria/json-schema'
import { JSONPointer } from '../../../util/JSONPointer'
import { isJSONObject } from '../../../util/isJSONObject'
import { Output, summarizedOutput } from '../../output'
import { Cache } from '../cache/Cache'
import { schemaValidator } from '../schema/schemaValidator'

export function propertyNamesValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  { cache, failFast }: { cache: Cache; failFast: boolean }
) {
  const propertyNames = schema['propertyNames']
  const validator = schemaValidator(propertyNames, `${schemaLocation}/propertyNames`, { cache, failFast })
  return (instance: any, instanceLocation: JSONPointer): Output => {
    if (!isJSONObject(instance)) {
      return { valid: true }
    }

    // property names don't have a path from the root
    const outputs = Object.keys(instance).map((propertyName) => validator(propertyName, ''))
    return summarizedOutput(outputs)
  }
}
