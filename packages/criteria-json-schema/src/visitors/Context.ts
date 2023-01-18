import { JSONPointer } from '../util/JSONPointer'
import { URI } from '../util/uri'

export interface Context {
  // The intial base URI of the schema
  baseURI: URI
  jsonPointerFromBaseURI: JSONPointer
  jsonPointerFromSchema: JSONPointer

  // resolved URIs that can be used to address the current location
  resolvedURIs: URI[]
}
