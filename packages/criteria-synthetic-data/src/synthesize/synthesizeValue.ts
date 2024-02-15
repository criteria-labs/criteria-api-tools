import { JSONSchemaDraft04, JSONSchemaDraft06, JSONSchemaDraft07, JSONSchemaDraft2020_12 } from '@criteria/json-schema'
import { Options } from './Options'
import { synthesizeArray } from './synthesizeArray'
import { synthesizeBoolean } from './synthesizeBoolean'
import { synthesizeNumber } from './synthesizeNumber'
import { synthesizeObject } from './synthesizeObject'
import { synthesizeString } from './synthesizeString'

type Schema = JSONSchemaDraft04 | JSONSchemaDraft06 | JSONSchemaDraft07 | JSONSchemaDraft2020_12

export function synthesizeValue(schema: Schema, options: Options): any {
  const { random } = options

  try {
    if (typeof schema === 'boolean') {
      return {}
    }

    if ('example' in schema) {
      return schema.example
    }

    if ('examples' in schema && (schema as any).examples.length > 0) {
      return (schema as any).examples[0]
    }

    if ('default' in schema) {
      return schema.default
    }

    if ('enum' in schema && Array.isArray(schema.enum)) {
      return schema.enum[Math.floor(schema.enum.length * random())]
    }

    if (!('type' in schema)) {
      return {}
    }

    if (Array.isArray(schema.type)) {
      const type = schema.type[Math.floor(schema.type.length * random())]
      return synthesizeValue({ ...schema, type }, options)
    }

    if (schema.type === 'object') {
      return synthesizeObject(schema, options)
    }
    if (schema.type === 'array') {
      return synthesizeArray(schema, options)
    }
    if (schema.type === 'integer' || schema.type === 'number') {
      return synthesizeNumber(schema, options)
    }
    if (schema.type === 'string') {
      return synthesizeString(schema, options)
    }
    if (schema.type === 'boolean') {
      return synthesizeBoolean(schema, options)
    }
    if (schema.type === 'null') {
      return null
    }
    return {}
  } catch {
    return {}
  }
}
