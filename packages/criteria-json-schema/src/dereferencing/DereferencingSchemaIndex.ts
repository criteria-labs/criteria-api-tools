import { evaluateJSONPointer } from '@criteria/json-pointer'
import { DocumentIndex } from '../schema-index/DocumentIndex'
import { ReferenceInfo } from '../schema-index/Index'
import { JSONReferenceContentIndex } from '../schema-index/JSONReferenceContentIndex'
import { SchemaContentIndex } from '../schema-index/SchemaContentIndex'
import { isJSONPointer } from '../util/JSONPointer'
import { URI, splitFragment } from '../util/uri'

export interface Metadata {
  metaSchemaURI: URI
}

export interface DereferencingSchemaIndexConfiguration {
  defaultMetaSchemaURI: URI
  cloned?: boolean
  retrieve?: (uri: URI) => any
}

export class DereferencingSchemaIndex extends DocumentIndex {
  readonly schemaContentIndex: SchemaContentIndex
  readonly jsonReferenceContentIndex: JSONReferenceContentIndex<Metadata>
  readonly defaultMetaSchemaURI: string
  constructor(configuration: DereferencingSchemaIndexConfiguration) {
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
    this.defaultMetaSchemaURI = configuration.defaultMetaSchemaURI
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

  addRootSchema(rootSchema: object, baseURI: URI) {
    rootSchema = this.addDocument(rootSchema, baseURI)

    const rootSchemaMetadata = {
      metaSchemaURI: this.defaultMetaSchemaURI
    }

    this.addSchemas(rootSchema, baseURI, rootSchemaMetadata)
    this.addJSONReferences(rootSchema, baseURI, rootSchemaMetadata)
  }

  addSchemas(rootSchema: any, baseURI: URI, metadata: Metadata) {
    const foundSchemaReferences = this.schemaContentIndex.addContentFromRoot(rootSchema, baseURI, metadata)
    foundSchemaReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

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
    const foundJSONReferences = this.jsonReferenceContentIndex.addContentFromRoot(rootObject, baseURI, metadata)
    foundJSONReferences.forEach((info, reference) => {
      this.references.set(reference, info)
    })

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
