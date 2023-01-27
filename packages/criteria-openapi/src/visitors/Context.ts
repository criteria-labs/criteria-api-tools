import { JSONPointer } from '../util/JSONPointer'
import { encodeURIFragment, URI } from '../util/uri'
import { uriFragmentIsJSONPointer } from '../util/uriFragmentIsJSONPointer'
import { VisitorConfiguration } from './visitValues'

export type ObjectType =
  | 'openAPI'
  | 'pathItem'
  | 'operation'
  | 'parameter'
  | 'requestBody'
  | 'mediaType'
  | 'encoding'
  | 'responses'
  | 'response'
  | 'callback'
  | 'example'
  | 'link'
  | 'header'
  | 'schema'
  | 'securityScheme'

export interface Context {
  configuration: VisitorConfiguration

  // The intial base URI of the schema
  baseURI: URI
  jsonPointerFromBaseURI: JSONPointer

  objectType: ObjectType | null
  jsonPointerFromObject: JSONPointer | null

  // resolved URIs that can be used to address the current location
  resolvedURIs: URI[]
}

// Returns a new context by appending the given JSON pointer
export function appendJSONPointer(context: Context, jsonPointer: JSONPointer): Context {
  return {
    configuration: context.configuration,
    baseURI: context.baseURI,
    jsonPointerFromBaseURI: `${context.jsonPointerFromBaseURI}${encodeURIFragment(jsonPointer) as JSONPointer}`,
    objectType: context.objectType,
    jsonPointerFromObject: `${context.jsonPointerFromObject}${encodeURIFragment(jsonPointer) as JSONPointer}`,
    resolvedURIs: context.resolvedURIs.filter(uriFragmentIsJSONPointer).map((uri) => {
      return `${uri}${encodeURIFragment(jsonPointer)}`
    })
  }
}
