import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../util/JSONPointer'
import { Context } from './Context'

type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'

export interface VisitorConfiguration {
  // Identifies whether we are deferencing an actual subschema,
  // and not just a nested object that happens to contain an 'id' property.
  // When this is called we already know typeof value === 'object',
  // so we won't mistake the JSON pointer for, say, an array of subschemas.
  isSubschema: (context: Context) => boolean

  // Returns the context resolved to the current schema
  resolveSchemaContext: (context: Context, schema: object) => Context

  // Returns the context resolved to the current reference
  resolveReferenceContext: (context: Context, reference: { $ref: string }) => Context

  // Returns a new context by appending the given JSON pointer
  appendJSONPointer: (context: Context, jsonPointer: JSONPointer) => Context
}

export function visitValues(
  root: object,
  rootContext: Context | null,
  configuration: VisitorConfiguration,
  visitor: (value: any, kind: Kind, context: Context) => boolean | void,
  leaver?: (value: any, kind: Kind, context: Context) => boolean | void
) {
  let stop = false
  var seen = new Set()

  const visitValue = (value: any, context: Context) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      // TODO: since circular objects can be referenced from more than one path,
      // this should return after the URIs have been indexed.
      if (seen.has(value)) {
        return
      }
      seen.add(value)

      if ('$ref' in value && typeof value.$ref === 'string') {
        // NOTE: this will detect a $ref anywhere in a document,
        // not just where a schema is expected, which may be against the specification.
        return visitReference(value, context)
      } else if (Array.isArray(value)) {
        return visitArray(value, context)
      } else if (configuration.isSubschema(context)) {
        return visitSchema(value, { ...context, jsonPointerFromSchema: '' })
      } else {
        return visitObject(value, context)
      }
    } else {
      return visitPrimitive(value, context)
    }
  }

  const visitObject = (object: object, context: Context) => {
    stop = Boolean(visitor(object, 'object', context))
    if (!stop) {
      for (const key in object) {
        stop = visitValue(object[key], configuration.appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
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

  const visitArray = (array: any[], context: Context) => {
    stop = Boolean(visitor(array, 'array', context))
    if (!stop) {
      for (let index = 0; index < array.length; index++) {
        stop = visitValue(array[index], configuration.appendJSONPointer(context, `/${index}`))
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

  const visitPrimitive = (primitive: any, context: Context) => {
    stop = Boolean(visitor(primitive, 'primitive', context))
    if (!stop) {
      stop = leaver && Boolean(leaver(primitive, 'primitive', context))
    }
    return stop
  }

  const visitSchema = (schema: object, context: Context) => {
    const resolvedContext = configuration.resolveSchemaContext(context, schema)
    stop = Boolean(visitor(schema, 'schema', resolvedContext))
    if (!stop) {
      for (const key in schema) {
        stop = visitValue(
          schema[key],
          configuration.appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`)
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

  const visitReference = (reference: { $ref: string }, context: Context) => {
    const resolvedContext = configuration.resolveReferenceContext(context, reference)
    stop = Boolean(visitor(reference, 'reference', resolvedContext))
    if (!stop) {
      stop = leaver && Boolean(leaver(reference, 'reference', resolvedContext))
    }
    return stop
  }

  visitValue(
    root,
    rootContext ?? { baseURI: '', jsonPointerFromBaseURI: '', jsonPointerFromSchema: '', resolvedURIs: [] }
  )
}
