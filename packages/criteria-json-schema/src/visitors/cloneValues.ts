import { escapeReferenceToken } from '@criteria/json-pointer'
import { appendJSONPointer, Context } from './Context'
import { ReferenceMergePolicy } from './visitValues'

export type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'
export type ReferenceContext = Context & { clone: (value: any, context: Context) => any }
export type SchemaContext = ReferenceContext & {
  cloneInto: (target: object) => void
  cloneSiblingsInto: (target: object) => void
}
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
  referenceMergePolicy: ReferenceMergePolicy,
  cloner: <Kind extends 'object' | 'array' | 'primitive' | 'schema' | 'reference'>(
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
      } else if (context.configuration.isSimpleReference(value, context, referenceMergePolicy)) {
        // Will also detect $dynamicRef outside of 2020-12.
        return cloneReference(value, { ...context, jsonPointerFromSchema: '' })
      } else if (context.configuration.isSubschema(context)) {
        return cloneSubschema(value, { ...context, jsonPointerFromSchema: '' })
      } else {
        return cloneObject(value, context)
      }
    } else {
      return clonePrimitive(value, context)
    }
  }

  const cloneObject = (object: object, context: Context) => {
    // __proto__ can only be set as an own property by parsing a JSON string,
    // otherwise it becomes the object's prototype
    const prepareTarget = (object: object) => {
      if (!object.hasOwnProperty('__proto__')) {
        return {}
      }
      const proto = object['__proto__']
      if (typeof proto === 'object' && proto !== null && !ArrayBuffer.isView(proto)) {
        if (Array.isArray(proto)) {
          return JSON.parse(`{ "__proto__": [] }`)
        } else {
          const protoTarget = prepareTarget(proto)
          return JSON.parse(`{ "__proto__": ${JSON.stringify(protoTarget)} }`)
        }
      } else {
        const clonedProto = cloneValue(proto, appendJSONPointer(context, `/__proto__`))
        return JSON.parse(`{ "__proto__": ${JSON.stringify(clonedProto)} }`)
      }
    }

    const cloneObjectInto = (target: object, object: object) => {
      for (const key in object) {
        if (key === '__proto__') {
          const proto = object['__proto__']
          if (typeof proto === 'object' && proto !== null && !ArrayBuffer.isView(proto)) {
            if (Array.isArray(proto)) {
              target['__proto__'].push(...cloneValue(proto, appendJSONPointer(context, `/__proto__`)))
            } else {
              cloneObjectInto(target['__proto__'], proto)
            }
          }
        } else {
          target[key] = cloneValue(object[key], appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
        }
      }
    }

    const target = prepareTarget(object)
    cloneObjectInto(target, object)
    return target
  }

  const cloneArray = (array: any[], context: Context) => {
    return array.map((value, index) => {
      return cloneValue(value, appendJSONPointer(context, `/${index}`))
    })
  }

  const clonePrimitive = (primitive: any, context: Context) => {
    return cloner(primitive, 'primitive', context)
  }

  const cloneSubschema = (schema: object, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, schema, referenceMergePolicy)

    const cloneInto = (target: object) => {
      for (const key in schema) {
        target[key] = cloneValue(schema[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
      }
    }
    const cloneSiblingsInto = (target: object) => {
      for (const key in schema) {
        if (key === '$ref') {
          continue
        }
        target[key] = cloneValue(schema[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
      }
    }
    return cloner(schema, 'schema', { ...resolvedContext, cloneInto, cloneSiblingsInto, clone: cloneValue })
  }

  const cloneReference = (reference: { $ref: string } | { $dynamicRef: string }, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, reference, referenceMergePolicy)
    return cloner(reference, 'reference', { ...resolvedContext, clone: cloneValue })
  }

  return cloneValue(root, rootContext)
}
