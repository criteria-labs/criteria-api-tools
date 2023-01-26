import { memoize } from '../retrievers/memoize'
import visitorConfigurationv3_0 from '../specification/v3.0/visitorConfiguration' // TODO: change to 3.1
import { normalizeURI, resolveURIReference, URI } from '../util/uri'
import { cloneValues, ObjectContext, ReferenceContext } from '../visitors/cloneValues'
import { VisitorConfiguration } from '../visitors/visitValues'
import { Index, indexDocumentInto } from './indexDocumentInto'
import { dereferenceJSONSchemaDraft04, dereferenceJSONSchemaDraft2020_12 } from '@criteria/json-schema'

interface Options {
  baseURI?: URI
  retrieve?: (uri: string) => object
  defaultConfiguration?: VisitorConfiguration
}

export const defaultBaseURI = ''
export const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}
export const defaultDefaultConfiguration = visitorConfigurationv3_0 // yes, defaultDefault...

export function dereferenceOpenAPI(openAPI: any, options?: Options) {
  const baseURI = normalizeURI(options?.baseURI ?? defaultBaseURI)
  const retrieve = memoize((uri: string) => {
    const document = uri === baseURI ? openAPI : options?.retrieve(uri) ?? defaultRetrieve(uri)
    if (!document) {
      throw new Error(`Invalid document retrieve at uri '${uri}'`)
    }
    return document
  })
  const defaultConfiguration = options?.defaultConfiguration ?? defaultDefaultConfiguration // yes, defaultDefault...

  const index = new Index()
  indexDocumentInto(index, openAPI, baseURI, defaultConfiguration, retrieve)

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
    // Ignore siblings according to the specification
    return dereferenceReference(reference, context)
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

  // Dereference any JSON schemas

  // Now that the object graph has been fully cloned, perform any post-processing
  deferredTasks.forEach((task) => task())

  return dereferencedDocuments[baseURI]
}
