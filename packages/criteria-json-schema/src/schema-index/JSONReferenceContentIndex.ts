import { evaluateJSONPointer, unescapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference } from '../util/uri'
import { visitJSONReferences } from '../util/visitJSONReferences'
import { ContentIndex, Index, ReferenceInfo } from './Index'

export interface JSONReferenceInfo<Metadata> {
  baseURI: URI
  metadata: Metadata
}

export interface JSONReferenceContentIndexConfiguration<Metadata> {
  shouldIndexObject: (reference: { $ref: string }) => boolean
}

// JSON Reference objects don't have their own identity.
// The are always access via JSON pointer from a containing object.
export class JSONReferenceContentIndex<Metadata> implements ContentIndex<Metadata> {
  private shouldIndexObject: (reference: { $ref: string }) => boolean
  constructor(configuration: JSONReferenceContentIndexConfiguration<Metadata>) {
    this.shouldIndexObject = configuration.shouldIndexObject
  }

  isObjectIndexed(object: object) {
    return false
  }

  isURIIndexed(uri: string) {
    return false
  }

  indexedObjectWithURI(uri: URI) {
    return undefined
  }

  infoForIndexedObject(value: any) {
    return undefined
  }

  addContentFromRoot(root: any, baseURI: URI, rootMetadata: Metadata) {
    let foundReferences = new Map<object, ReferenceInfo<Metadata>>()

    // technically shouldn't need this, but used for non-standard $refs
    visitJSONReferences(root, {}, (reference, location, state) => {
      if (this.isObjectIndexed(reference) || !this.shouldIndexObject(reference)) {
        return
      }

      const resolvedURI = resolveURIReference(reference.$ref, baseURI)

      const i = location.lastIndexOf('/')
      const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, root)
      const key = unescapeReferenceToken(location.slice(i + 1))

      foundReferences.set(reference, {
        resolvedURI,
        parent,
        key,
        metadata: rootMetadata,
        isDynamic: false,
        path: [location]
      })
    })

    return foundReferences
  }
}
