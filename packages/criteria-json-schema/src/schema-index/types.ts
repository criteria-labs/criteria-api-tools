import type { JSONPointer } from '@criteria/json-pointer'
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

export interface ReferenceInfo<Metadata> {
  resolvedURI: URI
  parent: any | null
  key: string
  metadata: Metadata
  isDynamic: boolean
  path: JSONPointer[]
}

export interface ContentIndex<Metadata> extends Index<Metadata> {
  addContentFromRoot: (root: any, baseURI: URI, rootMetadata: Metadata) => Map<object, ReferenceInfo<Metadata>>
}
