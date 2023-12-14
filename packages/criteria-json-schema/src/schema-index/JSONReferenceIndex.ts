import { evaluateJSONPointer, unescapeReferenceToken } from '@criteria/json-pointer'
import { JSONPointer } from '../util/JSONPointer'
import { URI, resolveURIReference } from '../util/uri'
import { visitJSONReferences } from '../util/visitJSONReferences'
import { Index } from './Index'

export interface JSONReferenceInfo<Metadata> {
  baseURI: URI
  metadata: Metadata
}

export interface ReferenceInfo<Metadata> {
  resolvedURI: URI
  parent: any | null
  key: string
  metadata: Metadata
  location: JSONPointer
}

export interface JSONReferenceIndexConfiguration<Metadata> {
  shouldIndexObject: (reference: { $ref: string }) => boolean
  foundReference: (reference: object, info: ReferenceInfo<Metadata>) => void
}

// JSON Reference objects don't have their own identity.
// The are always access via JSON pointer from a containing object.
export class JSONReferenceIndex<Metadata> implements Index<Metadata> {
  private shouldIndexObject: (reference: { $ref: string }) => boolean
  private foundReference: (reference: object, info: ReferenceInfo<Metadata>) => void
  constructor(configuration: JSONReferenceIndexConfiguration<Metadata>) {
    this.shouldIndexObject = configuration.shouldIndexObject
    this.foundReference = configuration.foundReference
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

  addJSONReferences(rootObject: object, baseURI: URI, rootObjectMetadata: Metadata) {
    let foundReferences = new Map<object, ReferenceInfo<Metadata>>()

    // technically shouldn't need this, but used for non-standard $refs
    visitJSONReferences(rootObject, {}, (reference, location, state) => {
      if (this.isObjectIndexed(reference) || !this.shouldIndexObject(reference)) {
        return
      }

      const resolvedURI = resolveURIReference(reference.$ref, baseURI)

      const i = location.lastIndexOf('/')
      const parent = location === '' ? null : evaluateJSONPointer(location.slice(0, i) as JSONPointer, rootObject)
      const key = unescapeReferenceToken(location.slice(i + 1))

      this.foundReference(reference, {
        resolvedURI,
        parent,
        key,
        metadata: rootObjectMetadata,
        location
      })
      foundReferences.set(reference, {
        resolvedURI,
        parent,
        key,
        metadata: rootObjectMetadata,
        location
      })
    })

    return foundReferences
  }
}
