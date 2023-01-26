import { memoize } from '../retrievers/memoize'
import visitorConfigurationv3_1 from '../specification/v3.1/visitorConfiguration'
import { normalizeURI, resolveURIReference, URI } from '../util/uri'
import { cloneValues, ObjectContext, ReferenceContext } from '../visitors/cloneValues'
import { VisitorConfiguration } from '../visitors/visitValues'
import { Index, indexDocumentInto } from './indexDocumentInto'

interface Options {
  baseURI?: URI
  retrieve?: (uri: string) => object
  merge?: (dereferencedObject: object, additionalProperties: object) => void
  defaultConfiguration?: VisitorConfiguration
}

export const defaultBaseURI = ''
export const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}
export const defaultMerge = (dereferencedObject: object, additionalProperties: object): void => {
  // No-op per the specification
  // when dereferencing a Reference object, any properties added SHALL be ignored.
}
export const defaultDefaultConfiguration = visitorConfigurationv3_1 // yes, defaultDefault...

export function dereferenceOpenAPI(openAPI: any, options?: Options) {
  const baseURI = normalizeURI(options?.baseURI ?? defaultBaseURI)
  const retrieve = memoize((uri: string) => {
    const document = uri === baseURI ? openAPI : options?.retrieve(uri) ?? defaultRetrieve(uri)
    if (!document) {
      throw new Error(`Invalid document retrieve at uri '${uri}'`)
    }
    return document
  })
  const merge = options?.merge ?? defaultMerge
  const defaultConfiguration = options?.defaultConfiguration ?? defaultDefaultConfiguration // yes, defaultDefault...

  const index = new Index()
  indexDocumentInto(index, openAPI, 'openAPI', baseURI, defaultConfiguration, retrieve)

  // Cache of previously dereferenced values by uri
  // Multiple URIs may refer to the same value
  const dereferencedByURI: { [uri: URI]: any } = {}

  // Maintains reference equality from the source schema
  // Important when the passed in schema is already dereferenced instead of JSON
  const dereferencedBySource = new Map()

  // tasks to execute once all values have been dereferenced
  // Can delete since only used for sibling properties?
  const deferredTasks: Array<() => void> = []

  const dereferenceObject = (object: any, context: ObjectContext) => {
    if (dereferencedBySource.has(object)) {
      return dereferencedBySource.get(object)
    }

    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    const result = {}
    dereferencedBySource.set(object, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    context.cloneInto(result)

    return result
  }

  const dereferenceReference = (reference: { $ref: string }, context: ReferenceContext) => {
    for (const uri of context.resolvedURIs) {
      const result = dereferencedByURI[uri]
      if (result) {
        return result
      }
    }

    // Keep following references until we find a concrete value
    // It was important to index all known schemas first so that we can follow all references to their conclusion
    const uri = resolveURIReference(reference.$ref, context.baseURI)
    const sourceValue = index.findValue(uri)

    if (!sourceValue) {
      throw new Error(`Invalid uri ${uri}`)
    }
    return context.clone(sourceValue.value, sourceValue.context)
  }

  const dereferenceReferenceWithSiblings = (reference: { $ref: string }, context: ReferenceContext) => {
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

    const dereferenced = dereferenceReference(
      { $ref },
      {
        ...context,
        resolvedURIs: [] // do not pass through since these point to a new unique merge object, not the referenced object
      }
    )

    // If there is a cyclic references, the object in `dereferenced` may still be being constructed.
    // If we assigned it's properties now, we will miss any properties that haven't been dereferenced yet.
    deferredTasks.push(() => {
      // Ignore siblings per the specification
      Object.assign(result, dereferenced)
      merge(result, siblings)
    })

    // TODO: can we dereference siblings now?

    dereferencedBySource.set(reference, result)
    context.resolvedURIs.forEach((uri) => (dereferencedByURI[uri] = result))
    return result
  }

  // Actually clone the OpenAPI document
  const dereferencedDocuments = {}
  for (const [uri, sourceDocument] of Object.entries(index.documentsByURI)) {
    dereferencedDocuments[uri] = cloneValues(sourceDocument.value, sourceDocument.context, (value, kind, context) => {
      if (kind === 'object') {
        if ('$ref' in value) {
          return dereferenceReferenceWithSiblings(value, context as ReferenceContext)
        } else {
          return dereferenceObject(value, context as ObjectContext)
        }
      } else if (kind === 'reference') {
        return dereferenceReference(value, context as ReferenceContext)
      } else {
        return value
      }
    })
  }

  // Now that the object graph has been fully cloned, perform any post-processing
  deferredTasks.forEach((task) => task())

  return dereferencedDocuments[baseURI]
}
