import { evaluateJSONPointer } from '@criteria/json-pointer'
import { JSONSchema, Reference } from '../JSONSchema'
import { hasFragment, normalizeURI, resolveURIReference, splitFragment, URI } from '../uri'
import { Context, contextAppendingJSONPointer, uriFragmentIsJSONPointer } from './visitors/context'
import { visitValues } from './visitors/visitValues'

type JSONPointer = '' | `/${string}`

export interface IndexEntry<T> {
  value: T
  context: Context
  circular?: boolean
}

export class Index {
  documentsByURI: { [uri: URI]: IndexEntry<any> }
  schemasByURI: { [uri: URI]: IndexEntry<JSONSchema> }
  referencesByURI: { [uri: URI]: IndexEntry<Reference> }
  constructor() {
    this.documentsByURI = {}
    this.schemasByURI = {}
    this.referencesByURI = {}
  }

  has(uri: URI): boolean {
    return (
      this.documentsByURI[uri] !== undefined ||
      this.schemasByURI[uri] !== undefined ||
      this.referencesByURI[uri] !== undefined
    )
  }

  findValue(uri: URI, seenReferences: Set<Reference> = new Set()): IndexEntry<any> {
    const schema = this.schemasByURI[uri]
    if (schema) {
      return schema
    }

    const reference = this.referencesByURI[uri]
    if (reference) {
      // Detect circular $refs
      // Note this is not circular JavaScript objects
      if (seenReferences.has(reference.value)) {
        // Throw an error?
        reference.circular = true
        return {
          ...reference,
          value: {} // erase $ref so that we don't recurse infinitely
        }
      }
      seenReferences.add(reference.value)

      if (Object.keys(reference.value).length > 1) {
        // don't follow references if they contain sibling properties
        return reference
      }
      const referencedValue = this.findValue(
        resolveURIReference(reference.value.$ref, reference.context.baseURI),
        seenReferences
      )
      if (!referencedValue) {
        throw new Error(`Invalid $ref '${reference.value.$ref}' at '${uri}'`)
      }
      return {
        value: referencedValue.value,
        context: {
          ...referencedValue.context,
          resolvedURIs: [...reference.context.resolvedURIs, ...referencedValue.context.resolvedURIs]
        }
      }
    }

    // Could get here if we are finding a base URI that points to a schema with an id that is different to it's retrieval uri
    // or a document that contains something other than a schema at its root.
    const document = this.documentsByURI[uri]
    if (document) {
      if (typeof document.value === 'object' && '$ref' in document.value && Object.keys(document.value).length === 1) {
        // Detect circular $refs
        // Note this is not circular JavaScript objects
        if (seenReferences.has(document.value)) {
          // Throw an error?
          document.circular = true
          return {
            ...document,
            value: {} // erase $ref so that we don't recurse infinitely
          }
        }
        seenReferences.add(document as any)

        const referencedValue = this.findValue(
          resolveURIReference(document.value.$ref, document.context.baseURI),
          seenReferences
        )
        if (!referencedValue) {
          throw new Error(`Invalid $ref '${document.value.$ref}' at '${uri}'`)
        }
        return {
          value: referencedValue.value,
          context: {
            ...referencedValue.context,
            resolvedURIs: [...document.context.resolvedURIs, ...referencedValue.context.resolvedURIs]
          }
        }
      }
      return document
    }

    // uri might be referencing the child of a value that was indexed via JSON pointer.
    const { fragment } = splitFragment(uri)
    if (typeof fragment === 'string' && fragment.startsWith('/')) {
      let index = uri.lastIndexOf('/')
      let parentURI = uri.slice(0, index)
      let remainingPointer = uri.slice(index) as JSONPointer // TODO: decode URI encoding but not slashes
      const parentValue = this.findValue(parentURI, new Set([...seenReferences])) // parent starts it's own chain of "seen" references
      if (!parentValue) {
        throw new Error(`Invalid uri '${parentURI}'`)
      }

      // If parent was a reference the resolved URIs may be different than what we started with.
      // Try to apply the remaining JSON pointer to the last (most specific) resolved URI of the parent.
      const parentResolvedURI = parentValue.context.resolvedURIs.filter((uri) => uriFragmentIsJSONPointer).at(-1)
      const transferredURI = parentResolvedURI ? `${parentResolvedURI}${remainingPointer}` : undefined
      if (transferredURI && transferredURI !== uri) {
        const transferredValue = this.findValue(transferredURI, seenReferences)
        if (!transferredValue) {
          throw new Error(`Invalid uri '${transferredURI}'`)
        }
        return {
          value: transferredValue.value,
          context: {
            ...transferredValue.context,
            resolvedURIs: [
              ...contextAppendingJSONPointer(parentValue.context, remainingPointer).resolvedURIs,
              ...transferredValue.context.resolvedURIs
            ]
          }
        }
      }

      if (parentValue.circular) {
        return {
          ...parentValue,
          value: {} // erase $ref so that we don't recurse infinitely
        }
      }

      // Then if that fails, then evaluate the JSON pointer from the parent JSON structure,
      // treating it as plain JSON.
      const evaluatedValue = evaluateJSONPointer(remainingPointer, parentValue.value)
      if (!evaluatedValue) {
        throw new Error(`Invalid JSON pointer ${remainingPointer} at ${parentURI}`)
      }
      return {
        value: evaluatedValue,
        context: {
          baseURI: parentURI,
          jsonPointer: remainingPointer,
          resolvedURIs: contextAppendingJSONPointer(parentValue.context, remainingPointer).resolvedURIs
        }
      }
    }

    // TODO: error message should contain URI reference ($ref), not resolved URI
    throw new Error(`Invalid uri ${uri}`)
  }
}

export function indexDocumentInto(index: Index, document: any, documentURI: URI, retrieve: (uri: URI) => JSONSchema) {
  const documentContext: Context = { baseURI: documentURI, jsonPointer: '', resolvedURIs: [] }

  index.documentsByURI[documentURI] = {
    value: document,
    context: documentContext
  }

  // Collect external URIs to retrieve
  var unretrievedURIs = new Set<URI>()
  visitValues(document, documentContext, (value, kind, context) => {
    if (kind === 'schema') {
      context.resolvedURIs.forEach(
        (uri) => (index.schemasByURI[uri] = { value, context: { ...context, _schema: true } as any })
      )
    } else if (kind === 'reference') {
      // Includes references with sibling properties
      context.resolvedURIs.forEach(
        (uri) => (index.referencesByURI[uri] = { value, context: { ...context, _ref: true } as any })
      )

      let uri = resolveURIReference((value as Reference).$ref, context.baseURI)
      const { absoluteURI } = splitFragment(uri)
      // Don't retrieve yet, because it may resolve to a nested schema with an id
      unretrievedURIs.add(absoluteURI)
    }
  })

  // Retrieve documents from URIs
  unretrievedURIs.forEach((uri) => {
    if (index.has(uri)) {
      return
    }
    let externalDocument
    try {
      externalDocument = retrieve(uri)
    } catch (error) {
      throw new Error(`Failed to retrieve document at uri '${uri}'`)
    }

    indexDocumentInto(index, externalDocument, uri, retrieve)
  })
}
