import { JSONPointer } from '../util/JSONPointer'
import { encodeURIFragment, URI } from '../util/uri'
import { uriFragmentIsJSONPointer } from '../util/uriFragmentIsJSONPointer'
import { VisitorConfiguration } from './visitValues'

export interface Context {
  configuration: VisitorConfiguration

  // The intial base URI of the schema
  baseURI: URI
  baseURIIsResolvedSchemaID: boolean // ensures resolving schema against base URI is idempotent
  jsonPointerFromBaseURI: JSONPointer
  jsonPointerFromSchema: JSONPointer

  // resolved URIs that can be used to address the current location
  resolvedURIs: URI[]
}

// Returns a new context by appending the given JSON pointer
export function appendJSONPointer(context: Context, jsonPointer: JSONPointer): Context {
  return {
    configuration: context.configuration,
    baseURI: context.baseURI,
    baseURIIsResolvedSchemaID: context.baseURIIsResolvedSchemaID,
    jsonPointerFromBaseURI: `${context.jsonPointerFromBaseURI}${encodeURIFragment(jsonPointer) as JSONPointer}`,
    jsonPointerFromSchema: `${context.jsonPointerFromSchema}${encodeURIFragment(jsonPointer) as JSONPointer}`,
    resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
      return `${uri}${encodeURIFragment(jsonPointer)}`
    })
  }
}
