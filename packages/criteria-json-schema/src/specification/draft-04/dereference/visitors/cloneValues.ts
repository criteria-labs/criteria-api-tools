import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchema, Reference } from '../../JSONSchema'
import { Context, contextAppendingIndex, contextAppendingKey, resolveSchemaInContext } from './context'
import { jsonPointerIsSubschema } from './visitValues'

type JSONPointer = '' | `/${string}`

export type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'
export type ContextWithCloneInto<K extends Kind> = Context &
  (K extends 'schema' ? { cloneInto: (instance: JSONSchema) => void } : {})

/**
 * Calls visitor once for each object in the schema, starting with the document root schema.
 *
 * @param schema The root schema.
 * @param cloner A function that gets called with each subschema and its JSON pointer.
 */
export function cloneValues(
  root: object,
  rootContext: Context,
  cloner: <Kind extends 'object' | 'array' | 'primitive' | 'schema' | 'reference'>(
    value: any,
    kind: Kind,
    context: ContextWithCloneInto<Kind>
  ) => any
) {
  const cloneValue = (value: any, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    if (typeof value === 'object' && value !== null && !ArrayBuffer.isView(value)) {
      // needs a seen guard?

      if ('$ref' in value && typeof value.$ref === 'string') {
        return cloneReference(value, jsonPointerWithinSchema, context)
      } else if (Array.isArray(value)) {
        return cloneArray(value, jsonPointerWithinSchema, context)
      } else if (jsonPointerIsSubschema(jsonPointerWithinSchema)) {
        return cloneSubschema(value, '', context)
      } else {
        return cloneObject(value, jsonPointerWithinSchema, context)
      }
    } else {
      return clonePrimitive(value, jsonPointerWithinSchema, context)
    }
  }

  const cloneObject = (object: object, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    const result: any = {}
    for (const key in object) {
      result[key] = cloneValue(
        object[key],
        `${jsonPointerWithinSchema}/${escapeReferenceToken(key)}`,
        contextAppendingKey(context, key)
      )
    }
    return result
  }

  const cloneArray = (array: any[], jsonPointerWithinSchema: JSONPointer, context: Context) => {
    return array.map((value, index) => {
      return cloneValue(value, `${jsonPointerWithinSchema}/${index}`, contextAppendingIndex(context, index))
    })
  }

  const clonePrimitive = (primitive: any, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    return cloner(primitive, 'primitive', context)
  }

  const cloneSubschema = (schema: JSONSchema, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    const { context: resolvedContext } = resolveSchemaInContext(schema, context)

    // TODO: only need this if placeholders exist
    const cloneInto = (clonedSchema: JSONSchema) => {
      for (const key in schema) {
        clonedSchema[key] = cloneValue(
          schema[key],
          `${jsonPointerWithinSchema}/${escapeReferenceToken(key)}`,
          contextAppendingKey(resolvedContext, key)
        )
      }
    }

    return cloner(schema, 'schema', { ...resolvedContext, cloneInto })
  }

  const cloneReference = (reference: Reference, jsonPointerWithinSchema: JSONPointer, context: Context) => {
    return cloner(reference, 'reference', context)
  }

  return cloneValue(root, '', rootContext)
}
