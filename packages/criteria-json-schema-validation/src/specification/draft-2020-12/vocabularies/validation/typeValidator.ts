import { DereferencedJSONSchemaObjectDraft2020_12, JSONSchemaDraft2020_12PrimitiveType } from '@criteria/json-schema'
import { JSONPointer } from '../../../../util/JSONPointer'
import { formatList } from '../../../../util/formatList'
import { isJSONArray } from '../../../../util/isJSONArray'
import { isJSONNumber } from '../../../../util/isJSONNumber'
import { isJSONObject } from '../../../../util/isJSONObject'
import { isJSONString } from '../../../../util/isJSONString'
import { assert } from '../../../../validation/assert'
import { ValidatorContext } from '../../../../validation/jsonValidator'
import { InvalidOutput, Output } from '../../../../validation/Output'

const formattedType = (primitiveType: JSONSchemaDraft2020_12PrimitiveType): string => {
  switch (primitiveType) {
    case 'array':
      return 'an array'
    case 'boolean':
      return 'a boolean'
    case 'integer':
      return 'an integer'
    case 'null':
      return 'null'
    case 'number':
      return 'a number'
    case 'object':
      return 'an object'
    case 'string':
      return 'a string'
  }
}

const formattedTypeOf = (instance: unknown): string => {
  if (instance === null) {
    return 'null'
  }
  if (typeof instance === 'object') {
    if (Array.isArray(instance)) {
      return 'an array'
    } else {
      return 'an object'
    }
  }
  if (typeof instance === 'number') {
    if (Number.isInteger(instance)) {
      return 'an integer'
    } else {
      return 'a number'
    }
  }
  return `a ${typeof instance}`
}

const jsonTypePredicate = (primitiveType: JSONSchemaDraft2020_12PrimitiveType): ((instance: unknown) => boolean) => {
  switch (primitiveType) {
    case 'array':
      return isJSONArray
    case 'boolean':
      return (instance: unknown) => typeof instance === 'boolean'
    case 'integer':
      return (instance: unknown) => Number.isInteger(instance)
    case 'null':
      return (instance: unknown) => instance === null
    case 'number':
      return isJSONNumber
    case 'object':
      return isJSONObject
    case 'string':
      return isJSONString
  }
}

export function typeValidator(
  schema: DereferencedJSONSchemaObjectDraft2020_12,
  schemaLocation: JSONPointer,
  context: ValidatorContext
) {
  if (!('type' in schema)) {
    return null
  }

  const type = schema['type']
  if (Array.isArray(type)) {
    const predicates = type.map((candidate) => jsonTypePredicate(candidate))
    const expectations = formatList(type.map(formattedType), 'or')
    return (instance: unknown, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      for (const predicate of predicates) {
        if (predicate(instance)) {
          return { valid: true, schemaLocation, instanceLocation }
        }
      }

      return {
        valid: false,
        schemaLocation,
        schemaKeyword: 'type',
        instanceLocation,
        message: `Expected either ${expectations} but found ${formattedTypeOf(instance)} instead`
      }
    }
  } else {
    const predicate = jsonTypePredicate(type)
    const expectation = formattedType(type)
    return (instance: unknown, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
      return assert(predicate(instance), `Expected ${expectation} but found ${formattedTypeOf(instance)} instead`, {
        schemaLocation,
        schemaKeyword: 'type',
        instanceLocation
      })
    }
  }
}
