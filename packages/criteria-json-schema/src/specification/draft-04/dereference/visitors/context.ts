import { escapeReferenceToken } from '@criteria/json-pointer'
import { JSONSchema, Reference } from '../../JSONSchema'
import { hasFragment, resolveURIReference, splitFragment, URI } from '../../uri'

type JSONPointer = '' | `/${string}`

export interface Context {
  // The intial base URI of the schema
  // See https://datatracker.ietf.org/doc/html/draft-wright-json-schema-00#section-8.1
  baseURI: URI

  // from base URI
  jsonPointer: JSONPointer

  // resolved URIs that can be used to address the current location
  resolvedURIs: URI[]
}

// when appending a key or index to a resolved uri,
// filter out uris that are a local identifier example.json#schema
export function uriFragmentIsJSONPointer(uri: URI): boolean {
  const { fragment } = splitFragment(uri)
  return typeof fragment === 'string' && (fragment === '' || fragment.startsWith('/'))
}

export function contextAppendingKey(context: Context, key: string): Context {
  return {
    baseURI: context.baseURI,
    jsonPointer: `${context.jsonPointer}/${escapeReferenceToken(key)}`,
    resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
      return `${uri}/${encodeURIComponent(escapeReferenceToken(key))}`
    })
  }
}

export function contextAppendingIndex(context: Context, index: number): Context {
  return {
    baseURI: context.baseURI,
    jsonPointer: `${context.jsonPointer}/${index}`,
    resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
      return `${uri}/${index}`
    })
  }
}

export function contextAppendingJSONPointer(context: Context, jsonPointer: JSONPointer): Context {
  return {
    baseURI: context.baseURI,
    jsonPointer: `${context.jsonPointer}${jsonPointer}`,
    resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
      return `${uri}${jsonPointer}` // TODO: URI encode, but not slashes
    })
    // TODO: need noURIFragment and add #?
  }
}

// Returns the context resolved to the current schema
export function resolveSchemaContext(context: Context, schema: JSONSchema): Context {
  let id: string | undefined
  if ('id' in schema && typeof schema.id === 'string') {
    id = resolveURIReference(schema.id, context.baseURI)
  }

  const baseURI = id ?? context.baseURI // id forms the new base uri if present
  const jsonPointer = id ? '' : context.jsonPointer // json pointer is either restarting from new root if id, or continues from previous base uri
  const resolvedURIs = context.resolvedURIs
  if (id) {
    resolvedURIs.push(id)
    if (!hasFragment(id)) {
      resolvedURIs.push(resolveURIReference('#', id))
    }
  }
  if (!id && jsonPointer === '') {
    // If no id fall back to the base URI if this is the root schema of the document
    resolvedURIs.push(baseURI)
    if (!hasFragment(baseURI)) {
      resolvedURIs.push(resolveURIReference('#', baseURI))
    }
  }

  return {
    baseURI,
    jsonPointer,
    resolvedURIs
  }
}

// Returns the resolved ID and the resolved schema context
export function resolveReferenceContext(context: Context, reference: Reference): Context {
  const resolvedURIs = context.resolvedURIs
  if (context.jsonPointer === '') {
    // Use the base URI if this is the root schema of the document
    resolvedURIs.push(context.baseURI)
    if (!hasFragment(context.baseURI)) {
      resolvedURIs.push(resolveURIReference('#', context.baseURI))
    }
  }

  return {
    baseURI: context.baseURI,
    jsonPointer: context.jsonPointer,
    resolvedURIs: resolvedURIs
  }
}
