import { memoize, retrieveBuiltin } from '../retrievers'
import { metaSchemaURI as metaSchemaURIDraft2020_12 } from '../specification/draft-2020-12/JSONSchema'
import { URI, normalizeURI } from '../util/uri'
import { SchemaIndex } from './SchemaIndex'

// default options
export const defaultCloned = false
export const defaultBaseURI = ''
export const defaultRetrieve = (uri: URI): any => {
  throw new Error(`Cannot retrieve URI '${uri}'`)
}
export const defaultDefaultMetaSchemaURI = metaSchemaURIDraft2020_12 // yes, defaultDefault...

export interface IndexOptions {
  cloned?: boolean
  baseURI?: URI
  retrieve?: (uri: URI) => any
  defaultMetaSchemaURI?: URI
}

export function indexSchema(schema: any, options: IndexOptions) {
  const cloned = options?.cloned ?? defaultCloned
  const baseURI = normalizeURI(options?.baseURI ?? defaultBaseURI)
  const retrieve = memoize((uri: string) => {
    const document = uri === baseURI ? schema : retrieveBuiltin(uri) ?? options?.retrieve(uri) ?? defaultRetrieve(uri)
    if (!document) {
      throw new Error(`Invalid document retrieve at uri '${uri}'`)
    }
    return document
  })
  const defaultMetaSchemaURI = options?.defaultMetaSchemaURI ?? defaultDefaultMetaSchemaURI

  // Index root schema
  const index = new SchemaIndex({ cloned, retrieve, defaultMetaSchemaURI })
  index.addDocument(schema, baseURI, '')

  return index
}
