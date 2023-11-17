import { escapeReferenceToken } from '@criteria/json-pointer'
import { appendJSONPointer, Context } from './Context'

type Kind = 'object' | 'array' | 'primitive' | 'schema' | 'reference'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export interface VisitorConfiguration {
  // The JSON schema dialect of this configuration
  dialect: string

  // Identifies whether we are deferencing an actual subschema,
  // and not just a nested object that happens to contain an 'id' property.
  // When this is called we already know typeof value === 'object',
  // so we won't mistake the JSON pointer for, say, an array of subschemas.
  isSubschema: (context: Context) => boolean

  // Whether to treat the value as a simple $ref without siblings (even if it has siblings)
  isSimpleReference: (value: object, context: Context, referenceMergePolicy: ReferenceMergePolicy) => boolean

  // Returns the context resolved to the current schema or reference
  resolveContext: (context: Context, schema: object, referenceMergePolicy: ReferenceMergePolicy) => Context

  // Applies referencedSchema to target.
  // Called when target contains $ref and sibling properties.
  // This is parameterized because it needs to be altered for the validation test suite
  mergeReferencedSchema: (
    target: object,
    referencedSchema: object,
    siblings: object,
    policy: ReferenceMergePolicy
  ) => void
}

export function visitValues(
  root: object,
  rootContext: Context | null,
  referenceMergePolicy: ReferenceMergePolicy,
  defaultConfiguration: VisitorConfiguration,
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
      } else if (context.configuration.isSimpleReference(value, context, referenceMergePolicy)) {
        // Will also detect $dynamicRef outside of 2020-12.

        return visitReference(value, { ...context, jsonPointerFromSchema: '' })
      } else if (context.configuration.isSubschema(context)) {
        return visitSchema(value, { ...context, jsonPointerFromSchema: '' })
      } else {
        return visitObject(value, context)
      }
    } else {
      if (typeof value === 'boolean' && context.configuration.isSubschema(context)) {
        return visitSchema(value, { ...context, jsonPointerFromSchema: '' })
      } else {
        return visitPrimitive(value, context)
      }
    }
  }

  const visitObject = (object: object, context: Context) => {
    stop = Boolean(visitor(object, 'object', context))
    if (!stop) {
      for (const key in object) {
        stop = visitValue(object[key], appendJSONPointer(context, `/${escapeReferenceToken(key)}`))
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

  const visitSchema = (schema: object | boolean, context: Context) => {
    if (typeof schema === 'boolean') {
      stop = Boolean(visitor(schema, 'schema', context))
      if (!stop) {
        stop = leaver && Boolean(visitor(schema, 'schema', context))
      }
      return stop
    }

    const resolvedContext = context.configuration.resolveContext(context, schema, referenceMergePolicy)
    stop = Boolean(visitor(schema, 'schema', resolvedContext))
    if (!stop) {
      for (const key in schema) {
        stop = visitValue(schema[key], appendJSONPointer(resolvedContext, `/${escapeReferenceToken(key)}`))
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

  const visitReference = (reference: { $ref: string } | { $dynamicRef: string }, context: Context) => {
    const resolvedContext = context.configuration.resolveContext(context, reference, referenceMergePolicy)
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

  visitValue(
    root,
    rootContext ?? {
      configuration: defaultConfiguration,
      baseURI: '',
      baseURIIsResolvedSchemaID: false,
      jsonPointerFromBaseURI: '',
      jsonPointerFromSchema: '',
      resolvedURIs: []
    }
  )
}
