import { escapeReferenceToken } from '@criteria/json-pointer'
import { Context } from './Context'
import { VisitorConfiguration } from './visitValues'

type JSONPointer = '' | `/${string}`

export type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'
export type SchemaContext = Context & { cloneInto: (target: object) => void }
export type ReferenceContext = Context & { clone: (value: any, context: Context) => any }
export type ContextForKind<K extends Kind> = K extends 'schema'
  ? SchemaContext
  : K extends 'reference'
  ? ReferenceContext
  : Context

/**
 * Calls visitor once for each object in the schema, starting with the document root schema.
 *
 * @param schema The root schema.
 * @param cloner A function that gets called with each subschema and its JSON pointer.
 */
export function cloneValues(
  root: object,
  rootContext: Context,
  configuration: VisitorConfiguration,
  cloner: <Kind extends 'object' | 'array' | 'primitive' | 'schema' | 'reference'>(
    value: any,
    kind: Kind,
    context: ContextForKind<Kind>
  ) => any
) {
  const cloneValue = (value: any, context: Context) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      // needs a seen guard?

      if ('$ref' in value && typeof value.$ref === 'string') {
        return cloneReference(value, context)
      } else if (Array.isArray(value)) {
        return cloneArray(value, context)
      } else if (configuration.isSubschema(context)) {
        return cloneSubschema(value, { ...context, jsonPointerFromSchema: '' })
      } else {
        return cloneObject(value, context)
      }
    } else {
      return clonePrimitive(value, context)
    }
  }

  const cloneObject = (object: object, context: Context) => {
    const result: any = {}
    for (const key in object) {
      result[key] = cloneValue(object[key], configuration.appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
    }
    return result
  }

  const cloneArray = (array: any[], context: Context) => {
    return array.map((value, index) => {
      return cloneValue(value, configuration.appendJSONPointer(context, `/${index}`))
    })
  }

  const clonePrimitive = (primitive: any, context: Context) => {
    return cloner(primitive, 'primitive', context)
  }

  const cloneSubschema = (schema: object, context: Context) => {
    const resolvedContext = configuration.resolveSchemaContext(context, schema)

    const cloneInto = (target: object) => {
      for (const key in schema) {
        target[key] = cloneValue(
          schema[key],
          configuration.appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`)
        )
      }
    }
    return cloner(schema, 'schema', { ...resolvedContext, cloneInto })
  }

  const cloneReference = (reference: { $ref: string }, context: Context) => {
    const resolvedContext = configuration.resolveReferenceContext(context, reference)
    return cloner(reference, 'reference', { ...resolvedContext, clone: cloneValue })
  }

  return cloneValue(root, rootContext)
}
