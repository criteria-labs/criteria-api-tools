import { URI } from '../util/uri'

export type IndexedObjectInfo<Metadata> = [Metadata] extends [never]
  ? {
      baseURI: URI
    }
  : {
      baseURI: URI
      metadata: Metadata
    }

export interface Index<Metadata> {
  isObjectIndexed: (object: object) => boolean
  isURIIndexed: (uri: URI) => boolean
  indexedObjectWithURI: (uri: URI) => any | undefined
  infoForIndexedObject: (value: any) => IndexedObjectInfo<Metadata> | undefined
}
