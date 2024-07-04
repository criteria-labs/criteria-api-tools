import { evaluateJSONPointer, isJSONPointer, type JSONPointer } from '@criteria/json-pointer'
import { DocumentIndex } from '../schema-index/DocumentIndex'
import { JSONReferenceContentIndex } from '../schema-index/JSONReferenceContentIndex'
import { SchemaContentIndex } from '../schema-index/SchemaContentIndex'
import { ReferenceInfo } from '../schema-index/types'
import { MaybePromise, chain, chainForEach } from '../util/promises'
import { URI, resolveURIReference, splitFragment } from '../util/uri'

export interface Metadata {
  metaSchemaID: URI
}

export interface SchemaIndexConfiguration {
  defaultMetaSchemaID: URI
  cloned?: boolean
  retrieve?: (uri: URI) => MaybePromise<any>
}

export class SchemaIndex extends DocumentIndex {
  readonly schemaContentIndex: SchemaContentIndex
  readonly jsonReferenceContentIndex: JSONReferenceContentIndex<Metadata>
  readonly defaultMetaSchemaID: string
  constructor(configuration: SchemaIndexConfiguration) {
    super({
      cloned: configuration.cloned,
      retrieve: configuration.retrieve
    })
    this.schemaContentIndex = new SchemaContentIndex()
    this.jsonReferenceContentIndex = new JSONReferenceContentIndex({
      shouldIndexObject: (object) => {
        // don't index as JSON Reference if already indexed as schema or document
        return !this.isObjectIndexed(object)
      }
    })
    this.defaultMetaSchemaID = configuration.defaultMetaSchemaID
  }

  readonly references = new Map<object, ReferenceInfo<Metadata>>()

  override isObjectIndexed(object: object): boolean {
    if (this.schemaContentIndex.isObjectIndexed(object)) {
      return true
    }
    if (this.jsonReferenceContentIndex.isObjectIndexed(object)) {
      return true
    }
    return super.isObjectIndexed(object)
  }

  override isURIIndexed(uri: string): boolean {
    if (this.schemaContentIndex.isURIIndexed(uri)) {
      return true
    }
    if (this.jsonReferenceContentIndex.isURIIndexed(uri)) {
      return true
    }
    return super.indexedObjectWithURI(uri)
  }

  override indexedObjectWithURI(uri: URI) {
    if (this.schemaContentIndex.isURIIndexed(uri)) {
      return this.schemaContentIndex.indexedObjectWithURI(uri)
    }
    if (this.jsonReferenceContentIndex.isURIIndexed(uri)) {
      return this.jsonReferenceContentIndex.indexedObjectWithURI(uri)
    }
    return super.indexedObjectWithURI(uri)
  }

  override infoForIndexedObject(object: any) {
    if (this.schemaContentIndex.isObjectIndexed(object)) {
      return this.schemaContentIndex.infoForIndexedObject(object)
    }
    if (this.jsonReferenceContentIndex.isObjectIndexed(object)) {
      return this.jsonReferenceContentIndex.infoForIndexedObject(object)
    }
    return super.infoForIndexedObject(object)
  }

  dereferenceReference(uri: URI, reference: { $ref: string }, schemaPath: JSONPointer[]) {
    const resolvedURI = this.references.get(reference)?.resolvedURI
    return this.find(resolvedURI, { followReferences: false })
  }

  dereferenceDynamicReference(uri: URI, dynamicReference: { $dynamicRef: string }, schemaPath: JSONPointer[]) {
    const resolvedURI = this.references.get(dynamicReference)?.resolvedURI
    const dereferencedSchema = this.find(resolvedURI, { followReferences: false })

    // A $dynamicRef without anchor in fragment behaves identical to $ref
    if (isJSONPointer(splitFragment(resolvedURI).fragment)) {
      return dereferencedSchema
    }

    const root = this.root()
    let candidate = root
    for (const jsonPointer of schemaPath) {
      candidate = evaluateJSONPointer(jsonPointer, candidate)

      if (jsonPointer === '/$ref' && typeof candidate === 'string') {
        const baseURI = this.infoForIndexedObject(dynamicReference).baseURI
        const uri = resolveURIReference(candidate, baseURI)
        candidate = this.find(uri, { followReferences: false })
      }

      if (typeof candidate !== 'object') {
        continue
      }

      if ('$dynamicAnchor' in candidate && candidate.$dynamicAnchor === dereferencedSchema.$dynamicAnchor) {
        return candidate
      }

      if ('$id' in candidate && typeof candidate.$id === 'string') {
        const outermostBaseURI = (this.infoForIndexedObject(candidate) ?? this.infoForIndexedObject(root))?.baseURI
        const outermostURI = resolveURIReference(candidate.$id, outermostBaseURI)
        const anchorURI = resolveURIReference(`#${dereferencedSchema.$dynamicAnchor}`, outermostURI)
        const candidateAnchor = this.find(anchorURI, { followReferences: false })
        if (candidateAnchor) {
          // An $anchor with the same name as a $dynamicAnchor is not used for dynamic scope resolution
          if (
            typeof candidateAnchor === 'object' &&
            '$dynamicAnchor' in candidateAnchor &&
            candidateAnchor.$dynamicAnchor === dereferencedSchema.$dynamicAnchor
          ) {
            return candidateAnchor
          }
        }
      }
    }

    return dereferencedSchema
  }

  addRootSchema(rootSchema: object, baseURI: URI): MaybePromise<void> {
    rootSchema = this.addDocument(rootSchema, baseURI)

    const rootSchemaMetadata = {
      metaSchemaID: this.defaultMetaSchemaID
    }

    const addSchemasResult = this.addSchemas(rootSchema, baseURI, rootSchemaMetadata)
    return chain(addSchemasResult, () => {
      return this.addJSONReferences(rootSchema, baseURI, rootSchemaMetadata)
    })
  }

  addSchemas(rootSchema: any, baseURI: URI, metadata: Metadata): MaybePromise<void> {
    const foundSchemaReferences = this.schemaContentIndex.addContentFromRoot(rootSchema, baseURI, metadata)
    foundSchemaReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

    return chainForEach(foundSchemaReferences.values(), (info: ReferenceInfo<Metadata>) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let documentOrPromise
      if (this.isURIIndexed(absoluteURI)) {
        documentOrPromise = this.indexedObjectWithURI(absoluteURI)
      } else {
        documentOrPromise = this.addDocumentWithURI(absoluteURI)
      }

      return chain(documentOrPromise, (document) => {
        if (document) {
          if (fragment && isJSONPointer(fragment)) {
            const rootObject = evaluateJSONPointer(fragment, document)
            if (rootObject) {
              const addSchemasResult = this.addSchemas(rootObject, info.resolvedURI, info.metadata)
              return chain(addSchemasResult, () => {
                return this.addJSONReferences(rootObject, info.resolvedURI, info.metadata)
              })
            }
          } else {
            const addSchemasResult = this.addSchemas(document, absoluteURI, info.metadata)
            return chain(addSchemasResult, () => {
              return this.addJSONReferences(document, absoluteURI, info.metadata)
            })
          }
        }
      })
    })
  }

  addJSONReferences(rootObject: any, baseURI: URI, metadata: Metadata): MaybePromise<void> {
    const foundJSONReferences = this.jsonReferenceContentIndex.addContentFromRoot(rootObject, baseURI, metadata)
    foundJSONReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

    return chainForEach(foundJSONReferences.values(), (info: ReferenceInfo<Metadata>) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let documentOrPromise
      if (!this.isURIIndexed(absoluteURI)) {
        documentOrPromise = this.addDocumentWithURI(absoluteURI)
      }

      return chain(documentOrPromise, (document) => {
        if (document) {
          if (fragment && isJSONPointer(fragment)) {
            const rootObject = evaluateJSONPointer(fragment, document)
            if (rootObject) {
              return this.addJSONReferences(rootObject, info.resolvedURI, info.metadata)
            }
          } else {
            return this.addJSONReferences(document, absoluteURI, info.metadata)
          }
        }
      })
    })
  }
}
