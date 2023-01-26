import { escapeReferenceToken } from '@criteria/json-pointer'
import { appendJSONPointer, Context } from './Context'
import { VisitorConfiguration } from './visitValues'

// object refers to an OpenAPI object, map refers to a plain JavaScript object
export type Kind = 'map' | 'array' | 'primitive' | 'object' | 'reference'
export type ReferenceContext = Context & { clone: (value: any, context: Context) => any }
export type ObjectContext = Context & {
  cloneInto: (target: object) => void
}
export type ContextForKind<K extends Kind> = K extends 'object'
  ? ObjectContext
  : K extends 'reference'
  ? ReferenceContext
  : Context

/**
 * Calls visitor once for each object in the schema, starting with the document root schema.
 *
 * @param schema The root document.
 * @param cloner A function that gets called with each subschema and its JSON pointer.
 */
export function cloneValues(
  root: object,
  rootContext: Context,
  cloner: <Kind extends 'map' | 'array' | 'primitive' | 'object' | 'reference'>(
    value: any,
    kind: Kind,
    context: ContextForKind<Kind>
  ) => any
) {
  const cloneValue = (value: any, context: Context) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      // needs a seen guard?

      if (Array.isArray(value)) {
        return cloneArray(value, context)
      }

      const objectType = context.configuration.objectType(context)
      if (objectType) {
        if ('$ref' in value && Object.keys(value).length === 1) {
          return cloneReference(value, { ...context, objectType, jsonPointerFromObject: '' })
        } else {
          return cloneObject(value, { ...context, objectType, jsonPointerFromObject: '' })
        }
      }

      return cloneMap(value, context)
    } else {
      return clonePrimitive(value, context)
    }
  }

  const cloneMap = (map: object, context: Context) => {
    const result: any = {}
    for (const key in map) {
      result[key] = cloneValue(map[key], appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
    }
    return result
  }

  const cloneArray = (array: any[], context: Context) => {
    return array.map((value, index) => {
      return cloneValue(value, appendJSONPointer(context, `/${index}`))
    })
  }

  const clonePrimitive = (primitive: any, context: Context) => {
    return cloner(primitive, 'primitive', context)
  }

  const cloneObject = (object: object, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, object)

    const cloneInto = (target: object) => {
      for (const key in object) {
        target[key] = cloneValue(object[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
      }
    }
    return cloner(object, 'object', { ...resolvedContext, cloneInto })
  }

  const cloneReference = (reference: { $ref: string }, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, reference)
    return cloner(reference, 'reference', { ...resolvedContext, clone: cloneValue })
  }

  return cloneValue(root, rootContext)
}
