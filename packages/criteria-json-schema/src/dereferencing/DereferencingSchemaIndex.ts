import { evaluateJSONPointer } from '@criteria/json-pointer'
import { DocumentIndex } from '../schema-index/DocumentIndex'
import { SchemaIndex } from '../schema-index/SchemaIndex'
import { JSONPointer, isJSONPointer } from '../util/JSONPointer'
import { URI, splitFragment } from '../util/uri'
import { JSONReferenceIndex } from '../schema-index/JSONReferenceIndex'

export interface Metadata {
  metaSchemaURI: URI
}

export interface DereferencingSchemaIndexConfiguration {
  defaultMetaSchemaURI: URI
  cloned?: boolean
  retrieve?: (uri: URI) => any
}

export interface ReferenceInfo {
  resolvedURI: URI
  parent: any | null
  key: string
  metadata: Metadata
  isDynamic: boolean
  path: JSONPointer[]
}

export class DereferencingSchemaIndex extends DocumentIndex {
  readonly schemaIndex: SchemaIndex
  readonly jsonReferenceIndex: JSONReferenceIndex<Metadata>
  readonly defaultMetaSchemaURI: string
  constructor(configuration: DereferencingSchemaIndexConfiguration) {
    super({
      cloned: configuration.cloned,
      retrieve: configuration.retrieve
    })
    this.schemaIndex = new SchemaIndex({
      foundReference: (reference, info) => {
        this.references.set(reference, info)
      }
    })
    this.jsonReferenceIndex = new JSONReferenceIndex({
      shouldIndexObject: (object) => {
        // don't index as JSON Reference if already indexed as schema or document
        return !this.isObjectIndexed(object)
      },
      foundReference: (reference, info) => {
        this.references.set(reference, { ...info, isDynamic: false, path: [info.location] })
      }
    })
    this.defaultMetaSchemaURI = configuration.defaultMetaSchemaURI
  }

  readonly references = new Map<object, ReferenceInfo>()

  override isObjectIndexed(object: object): boolean {
    if (this.schemaIndex.isObjectIndexed(object)) {
      return true
    }
    if (this.jsonReferenceIndex.isObjectIndexed(object)) {
      return true
    }
    return super.isObjectIndexed(object)
  }

  override isURIIndexed(uri: string): boolean {
    if (this.schemaIndex.isURIIndexed(uri)) {
      return true
    }
    if (this.jsonReferenceIndex.isURIIndexed(uri)) {
      return true
    }
    return super.indexedObjectWithURI(uri)
  }

  override indexedObjectWithURI(uri: URI) {
    if (this.schemaIndex.isURIIndexed(uri)) {
      return this.schemaIndex.indexedObjectWithURI(uri)
    }
    if (this.jsonReferenceIndex.isURIIndexed(uri)) {
      return this.jsonReferenceIndex.indexedObjectWithURI(uri)
    }
    return super.indexedObjectWithURI(uri)
  }

  override infoForIndexedObject(object: any) {
    if (this.schemaIndex.isObjectIndexed(object)) {
      return this.schemaIndex.infoForIndexedObject(object)
    }
    if (this.jsonReferenceIndex.isObjectIndexed(object)) {
      return this.jsonReferenceIndex.infoForIndexedObject(object)
    }
    return super.infoForIndexedObject(object)
  }

  addRootSchema(rootSchema: object, baseURI: URI) {
    rootSchema = this.addDocument(rootSchema, baseURI)

    const rootSchemaMetadata = {
      metaSchemaURI: this.defaultMetaSchemaURI
    }

    this.addSchemas(rootSchema, baseURI, rootSchemaMetadata)
    this.addJSONReferences(rootSchema, baseURI, rootSchemaMetadata)
  }

  addSchemas(rootSchema: any, baseURI: URI, metadata: Metadata) {
    const foundSchemaReferences = this.schemaIndex.addSchemasFromRootObject(rootSchema, baseURI, metadata)

    foundSchemaReferences.forEach((info, reference) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let document
      if (this.isURIIndexed(absoluteURI)) {
        document = this.indexedObjectWithURI(absoluteURI)
      } else {
        document = this.addDocumentWithURI(absoluteURI)
      }

      if (document) {
        if (fragment && isJSONPointer(fragment)) {
          const rootObject = evaluateJSONPointer(fragment, document)
          if (rootObject) {
            this.addSchemas(rootObject, info.resolvedURI, info.metadata)
            this.addJSONReferences(rootObject, info.resolvedURI, info.metadata)
          }
        } else {
          this.addSchemas(document, absoluteURI, info.metadata)
          this.addJSONReferences(document, absoluteURI, info.metadata)
        }
      }
    })
  }

  addJSONReferences(rootObject: any, baseURI: URI, metadata: Metadata) {
    // should be on entire document?
    const foundJSONReferences = this.jsonReferenceIndex.addJSONReferences(rootObject, baseURI, metadata)

    foundJSONReferences.forEach((info, reference) => {
      if (this.isURIIndexed(info.resolvedURI)) {
        return
      }

      const { absoluteURI, fragment } = splitFragment(info.resolvedURI)

      let document
      if (!this.isURIIndexed(absoluteURI)) {
        document = this.addDocumentWithURI(absoluteURI)
      }

      if (document) {
        if (fragment && isJSONPointer(fragment)) {
          const rootObject = evaluateJSONPointer(fragment, document)
          if (rootObject) {
            this.addJSONReferences(rootObject, info.resolvedURI, info.metadata)
          }
        } else {
          this.addJSONReferences(document, absoluteURI, info.metadata)
        }
      }
    })
  }
}
