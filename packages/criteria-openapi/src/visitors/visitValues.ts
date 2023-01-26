import { escapeReferenceToken } from '@criteria/json-pointer'
import { appendJSONPointer, Context, ObjectType } from './Context'

type Kind = 'map' | 'array' | 'primitive' | 'object' | 'reference'

export interface VisitorConfiguration {
  // The JSON schema dialect of this configuration
  jsonSchemaDialect: string

  // Returns the type of object at the context's location
  objectType: (context: Context) => ObjectType | null

  // Returns the context resolved to the current schema or reference
  resolveContext: (context: Context, schema: object) => Context
}

export function visitValues(
  root: object,
  rootContext: Context,
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

      if (Array.isArray(value)) {
        return visitArray(value, context)
      }

      const objectType = context.configuration.objectType(context)
      if (objectType) {
        if ('$ref' in value && Object.keys(value).length === 1) {
          return visitReference(value, { ...context, objectType, jsonPointerFromObject: '' })
        } else {
          return visitObject(value, { ...context, objectType, jsonPointerFromObject: '' })
        }
      }

      return visitMap(value, context)
    } else {
      return visitPrimitive(value, context)
    }
  }

  const visitMap = (map: object, context: Context) => {
    stop = Boolean(visitor(map, 'map', context))
    if (!stop) {
      for (const key in map) {
        stop = visitValue(map[key], appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(leaver(map, 'map', context))
    }
    return stop
  }

  const visitArray = (array: any[], context: Context) => {
    stop = Boolean(visitor(array, 'array', context))
    if (!stop) {
      for (let index = 0; index < array.length; index++) {
        stop = visitValue(array[index], appendJSONPointer(context, `/${index}`))
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

  const visitObject = (schema: object, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, schema)
    stop = Boolean(visitor(schema, 'object', resolvedContext))
    if (!stop) {
      for (const key in schema) {
        stop = visitValue(schema[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(visitor(schema, 'object', resolvedContext))
    }
    return stop
  }

  const visitReference = (reference: { $ref: string }, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, reference)
    stop = Boolean(visitor(reference, 'reference', resolvedContext))
    if (!stop) {
      // recurse into siblings if there are any, otherwise this will just call visitPrimitive with the value of $ref
      for (const key in reference) {
        stop = visitValue(reference[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
        if (stop) {
          break
        }
      }
    }
    if (!stop) {
      stop = leaver && Boolean(leaver(reference, 'reference', resolvedContext))
    }
    return stop
  }

  visitValue(root, rootContext)
}
