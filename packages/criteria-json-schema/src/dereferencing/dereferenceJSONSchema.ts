import { retrieveBuiltin } from '../retrievers'
import { memoize } from '../retrievers/memoize'
import visitorConfiguration2020_12 from '../specification/draft-2020-12/visitorConfiguration'
import { normalizeURI, resolveURIReference, URI } from '../util/uri'
import { cloneValues, ReferenceContext, SchemaContext } from '../visitors/cloneValues'
import { ReferenceMergePolicy, VisitorConfiguration, visitValues } from '../visitors/visitValues'
import { Index, indexDocumentInto } from './indexDocumentInto'

interface Options {
  baseURI?: URI
  retrieve?: (uri: URI) => any
  referenceMergePolicy?: ReferenceMergePolicy
  defaultConfiguration?: VisitorConfiguration
}

export const defaultBaseURI = ''
export const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}
export const defaultReferenceMergePolicy = 'by_keyword'
export const defaultDefaultConfiguration = visitorConfiguration2020_12 // yes, defaultDefault...

// TODO: warn on violations of SHOULD directives
export function dereferenceJSONSchema(schema: any, options?: Options) {
  const baseURI = normalizeURI(options?.baseURI ?? defaultBaseURI)
  const retrieve = memoize((uri: string) => {
    const document = uri === baseURI ? schema : retrieveBuiltin(uri) ?? options?.retrieve(uri) ?? defaultRetrieve(uri)
    if (!document) {
      throw new Error(`Invalid document retrieve at uri '${uri}'`)
    }
    return document
  })
  const referenceMergePolicy = options?.referenceMergePolicy ?? defaultReferenceMergePolicy
  const defaultConfiguration = options?.defaultConfiguration ?? defaultDefaultConfiguration

  const index = new Index()
  indexDocumentInto(index, schema, baseURI, referenceMergePolicy, defaultConfiguration, retrieve)

  // Cache of previously dereferenced values by uri
  // Multiple URIs may refer to the same value
  const dereferencedByURI: { [uri: URI]: any } = {}

  // Maintains reference equality from the source schema
  // Important when the passed in schema is already dereferenced instead of JSON
  const dereferencedBySource = new Map()

  // tasks to execute once all values have been dereferenced
  const deferredTasks: Array<() => void> = []

  // This is used to follow $dynamicRef references
  const dynamicPath = []

  const dereferenceSubschema = (schema: any, context: SchemaContext) => {
    if (dereferencedBySource.has(schema)) {
      return dereferencedBySource.get(schema)
    }

    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    const result = {}
    dereferencedBySource.set(schema, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    dynamicPath.push(context)
    context.cloneInto(result)
    dynamicPath.pop()
    return result
  }

  const dereferenceReference = (reference: { $ref: string } | { $dynamicRef: string }, context: ReferenceContext) => {
    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    if ('$ref' in reference) {
      // Keep following references until we find a concrete value
      // It was important to index all known schemas first so that we can follow all references to their conclusion
      const uri = resolveURIReference(reference.$ref, context.baseURI)

      dynamicPath.push(context)
      const sourceValue = index.findValue(uri)
      dynamicPath.pop()

      if (!sourceValue) {
        throw new Error(`Invalid uri ${uri}`)
      }
      return context.clone(sourceValue.value, sourceValue.context)
    }
    if ('$dynamicRef' in reference) {
      // starting from outermost dynamic context, see if any lexical children have the dynamic anchor
      let sourceValue
      for (const dynamicContext of dynamicPath) {
        const uri = dynamicContext.resolvedURIs[dynamicContext.resolvedURIs.length - 1]
        let schema = index.schemasByURI[uri] ?? index.referencesByURI[uri] ?? index.dynamicReferencesByURI[uri]
        if (!schema) {
          throw new Error(`No schema at uri '${uri}'`) // should never get here
        }

        visitValues(
          schema.value,
          schema.context,
          referenceMergePolicy,
          context.configuration,
          (value, kind, context) => {
            if (typeof value === 'object' && '$dynamicAnchor' in value) {
              if (`#${value.$dynamicAnchor}` === reference.$dynamicRef) {
                sourceValue = { value, context }
                return true // stop
              }
            }
          }
        )
        if (sourceValue) {
          break
        }
      }

      if (!sourceValue) {
        throw new Error(`Invalid dynamic ref '${reference.$dynamicRef}'`)
      }
      return context.clone(sourceValue.value, sourceValue.context)
    }
  }

  const dereferenceReferenceWithSiblings = (reference: { $ref: string }, context: SchemaContext) => {
    // Merging $ref and siblings creates a new unique object,
    // otherwise sibling properties will be applied everywhere the same $ref is used
    // Assume that siblings does not need to be further dereferenced

    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    const { $ref, ...siblings } = reference

    // Since references with siblings are treated as unique merged objects, we may still get cycles here
    // If we detect a cycle, we still have to apply sibling properties
    if (dereferencedBySource.has(reference)) {
      const result = dereferencedBySource.get(reference)
      context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
      return result
    }

    const result = {}
    dereferencedBySource.set(reference, result)

    dynamicPath.push(context)
    const dereferenced = dereferenceReference(
      { $ref },
      {
        ...context,
        resolvedURIs: [] // do not pass through since these point to a new unique merge object, not the referenced object
      }
    )
    dynamicPath.pop()

    // If there is a cyclic references, the object in `dereferenced` may still be being constructed.
    // If we assigned it's properties now, we will miss any properties that haven't been dereferenced yet.
    deferredTasks.push(() => {
      const siblingsResult = {}
      context.cloneSiblingsInto(siblingsResult)
      context.configuration.mergeReferencedSchema(result, dereferenced, siblingsResult, referenceMergePolicy)
    })

    // TODO: can we dereference siblings now?

    dereferencedBySource.set(reference, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    return result
  }

  // Actually clone the schema
  // TODO: should this only clone the root one? can ony be pne dynamic path.
  const dereferencedDocuments = {}
  for (const [uri, sourceDocument] of Object.entries(index.documentsByURI)) {
    dereferencedDocuments[uri] = cloneValues(
      sourceDocument.value,
      sourceDocument.context,
      referenceMergePolicy,
      (value, kind, context) => {
        if (kind === 'schema') {
          if ('$ref' in value || '$dynamicRef' in value) {
            return dereferenceReferenceWithSiblings(value, context as SchemaContext)
          } else {
            return dereferenceSubschema(value, context as SchemaContext)
          }
        } else if (kind === 'reference') {
          return dereferenceReference(value, context as ReferenceContext)
        } else {
          return value
        }
      }
    )
  }

  // Now that the object graph has been fully cloned, perform any post-processing
  deferredTasks.forEach((task) => task())

  return dereferencedDocuments[baseURI]
}
