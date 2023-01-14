import { escapeReferenceToken } from '@criteria/json-pointer'
import { Options } from 'prettier'
import { JSONSchema, Reference } from '../../JSONSchema'
import { hasFragment, resolveURIReference } from '../../uri'
import {
  Context,
  contextAppendingIndex,
  contextAppendingKey,
  resolveSchemaContext,
  resolveReferenceContext
} from './context'

type JSONPointer = '' | `/${string}`
type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'

// Identifies whether we are deferencing an actual subschema,
// and not just a nested object that happens to contain an 'id' property.
// When this is called we already know typeof value === 'object',
// so we won't mistake the JSON pointer for, say, an array of subschemas.
export function jsonPointerIsSubschema(jsonPointer: JSONPointer) {
  return (
    jsonPointer === '' ||
    jsonPointer === '/additionalItems' ||
    jsonPointer === '/items' ||
    jsonPointer.match(/^\/items\/[\d]+$/) ||
    jsonPointer.match(/^\/properties\/[^/]+$/) ||
    jsonPointer.match(/^\/patternProperties\/[^/]+$/) ||
    jsonPointer === '/additionalProperties' ||
    jsonPointer.match(/^\/dependencies\/[^/]+$/) ||
    jsonPointer.match(/^\/allOf\/[\d]+$/) ||
    jsonPointer.match(/^\/anyOf\/[\d]+$/) ||
    jsonPointer.match(/^\/oneOf\/[\d]+$/) ||
    jsonPointer === '/not' ||
    jsonPointer.match(/^\/definitions\/[^/]+$/)
  )
}

export function visitValues(
  root: object,
  rootContext: Context | null,
  visitor: (value: any, kind: Kind, context: Context) => boolean | void,
  leaver?: (value: any, kind: Kind, context: Context) => boolean | void
) {
  let stop = false
  var seen = new Set()

  const visitValue = (value: any, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      // TODO: since circular objects can be referenced from more than one path,
      // this should return after the URIs have been indexed.
      if (seen.has(value)) {
        return
      }
      seen.add(value)

      if ('$ref' in value && typeof value.$ref === 'string') {
        return visitReference(value, jsonPointerWithinSchema, context)
      } else if (Array.isArray(value)) {
        return visitArray(value, jsonPointerWithinSchema, context)
      } else if (jsonPointerIsSubschema(jsonPointerWithinSchema)) {
        return visitSchema(value, '', context)
      } else {
        return visitObject(value, jsonPointerWithinSchema, context)
      }
    } else {
      return visitPrimitive(value, jsonPointerWithinSchema, context)
    }
  }

  const visitObject = (object: object, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    stop = Boolean(visitor(object, 'object', context))
    if (!stop) {
      for (const key in object) {
        stop = visitValue(
          object[key],
          `${jsonPointerWithinSchema}/${escapeReferenceToken(key)}`,
          contextAppendingKey(context, key)
        )
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(leaver(object, 'object', context))
    }
    return stop
  }

  const visitArray = (array: any[], jsonPointerWithinSchema: JSONPointer, context: Context) => {
    stop = Boolean(visitor(array, 'array', context))
    if (!stop) {
      for (let index = 0; index < array.length; index++) {
        stop = visitValue(array[index], `${jsonPointerWithinSchema}/${index}`, contextAppendingIndex(context, index))
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(leaver(array, 'array', context))
    }
    return stop
  }

  const visitPrimitive = (primitive: any, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    stop = Boolean(visitor(primitive, 'primitive', context))
    if (!stop) {
      stop = leaver && Boolean(leaver(primitive, 'primitive', context))
    }
    return stop
  }

  const visitSchema = (schema: JSONSchema, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    const resolvedContext = resolveSchemaContext(context, schema)
    stop = Boolean(visitor(schema, 'schema', resolvedContext))
    if (!stop) {
      for (const key in schema) {
        stop = visitValue(
          schema[key],
          `${jsonPointerWithinSchema}/${escapeReferenceToken(key)}`,
          contextAppendingKey(resolvedContext, key)
        )
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(visitor(schema, 'schema', resolvedContext))
    }
    return stop
  }

  const visitReference = (reference: Reference, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    const resolvedContext = resolveReferenceContext(context, reference)
    stop = Boolean(visitor(reference, 'reference', resolvedContext))
    if (!stop) {
      stop = leaver && Boolean(leaver(reference, 'reference', resolvedContext))
    }
    return stop
  }

  visitValue(root, '', rootContext ?? { baseURI: '', jsonPointer: '', resolvedURIs: [] })
}
