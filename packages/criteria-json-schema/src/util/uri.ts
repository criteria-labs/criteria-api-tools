import { normalize, parse, resolve, serialize } from 'uri-js'

export type URI = string
export type URIReference = string
export type URIFragment = `#${string}`

export function resolveURIReference(uriReference: URIReference, baseURI: URI): URI {
  return resolve(baseURI, uriReference)
}

export function isAbsoluteURI(uri: string) {
  const components = parse(uri)
  return components.scheme !== undefined && components.fragment === undefined
}

export function isSameDocumentReference(uri: string): uri is URIFragment {
  const { fragment, reference } = parse(uri)
  return reference === 'same-document' && fragment !== undefined
}

export function hasFragment(uri: string): boolean {
  const { fragment } = parse(uri)
  return fragment !== undefined
}

export function splitFragment(uri: URI): { absoluteURI: URI; fragment: string } {
  const { fragment, ...restComponents } = parse(uri)
  return {
    absoluteURI: normalize(serialize(restComponents)),
    fragment: fragment
  }
}

export function normalizeURI(uri: URI): URI {
  return normalize(uri)
}
