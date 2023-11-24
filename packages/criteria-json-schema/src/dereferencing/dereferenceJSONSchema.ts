import { evaluateJSONPointer } from '@criteria/json-pointer'
import { mergeReferenceInto as mergeReferenceIntoDraft04 } from '../specification/draft-04/mergeReferenceInto'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { mergeReferenceInto as mergeReferenceIntoDraft2020_12 } from '../specification/draft-2020-12/mergeReferenceInto'
import {
  isPlainKeyword,
  visitSubschemas as visitSubschemasDraft2020_12
} from '../specification/draft-2020-12/visitSubschemas'
import { JSONPointer } from '../util/JSONPointer'
import { resolveURIReference } from '../util/uri'
import { IndexOptions, defaultDefaultMetaSchemaURI, indexSchema } from './indexSchema'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export type DereferenceOptions = IndexOptions & {
  referenceMergePolicy?: ReferenceMergePolicy
}

export function dereferenceJSONSchema(rootSchema: any, options: DereferenceOptions) {
  const referenceMergePolicy = options?.referenceMergePolicy ?? defaultReferenceMergePolicy
  const defaultMetaSchemaURI = options?.defaultMetaSchemaURI ?? defaultDefaultMetaSchemaURI

  const visitSubschemas = (metaSchemaURI: string) => {
    switch (metaSchemaURI) {
      case 'https://json-schema.org/draft/2020-12/schema':
        return visitSubschemasDraft2020_12
      case 'http://json-schema.org/draft-04/schema#':
        return visitSubschemasDraft04
      default:
        return visitSubschemas(defaultMetaSchemaURI)
    }
  }

  const mergeReferenceInto = (metaSchemaURI: string) => {
    switch (metaSchemaURI) {
      case 'https://json-schema.org/draft/2020-12/schema':
        return mergeReferenceIntoDraft2020_12
      case 'http://json-schema.org/draft-04/schema#':
        return mergeReferenceIntoDraft04
      default:
        return mergeReferenceInto(defaultMetaSchemaURI)
    }
  }

  // Index root schema
  const index = indexSchema(rootSchema, {
    cloned: true,
    baseURI: options?.baseURI,
    retrieve: options.retrieve,
    defaultMetaSchemaURI: options.defaultMetaSchemaURI
  })

  const dereferenceReference = (reference: { $ref: string }) => {
    const baseURI = index.baseURIForSchema(reference)
    const uri = resolveURIReference(reference.$ref, baseURI)
    return index.find(uri, { followReferences: true })
  }

  const dereferenceDynamicReference = (dynamicReference: { $dynamicRef: string }) => {
    const baseURI = index.baseURIForSchema(dynamicReference)
    const uri = resolveURIReference(dynamicReference.$dynamicRef, baseURI)
    return index.find(uri, { followReferences: true })
  }

  const dereferenceNonStandardReference = (reference: { $ref: string }, parentSchema: any) => {
    const baseURI = index.baseURIForSchema(parentSchema)
    const uri = resolveURIReference(reference.$ref, baseURI)
    return index.find(uri, { followReferences: true })
  }

  const references = new Map<
    { $ref: any },
    {
      metaSchemaURI: string
      parent: any
      key: string
      dereferencedValue: any
    }
  >()
  const dynamicReferences = new Map<
    { $dynamicRef: any },
    {
      document: any
      path: JSONPointer[]
      parent: any
      key: string
      dereferencedValue: any
    }
  >()

  const collected = new Set()
  const collectReferences = (subschema: object | boolean, path: JSONPointer[], document: any) => {
    if (typeof subschema !== 'object') {
      return
    }

    if (collected.has(subschema)) {
      return
    }
    collected.add(subschema)

    if ('$ref' in subschema && typeof subschema.$ref === 'string') {
      const dereferencedValue = dereferenceReference(subschema as { $ref: string })
      subschema.$ref = dereferencedValue // TODO: can these lines be removed??

      const jsonPointer = path.join('')
      if (jsonPointer === '') {
        // flattened = subschema.$ref
      } else {
        const i = jsonPointer.lastIndexOf('/')
        const parentJSONPointer = jsonPointer.slice(0, i) as JSONPointer
        const key = jsonPointer.slice(i + 1)
        const parent = evaluateJSONPointer(parentJSONPointer, document)

        references.set(subschema as { $ref: any }, {
          metaSchemaURI: index.metaSchemaURIForSchema(parent),
          parent,
          key,
          dereferencedValue
        })
      }

      collectReferences(dereferencedValue, [...path, '/$ref'], document)
    }

    if ('$dynamicRef' in subschema && typeof subschema.$dynamicRef === 'string') {
      const dereferencedValue = dereferenceDynamicReference(subschema as { $dynamicRef: string })
      subschema.$dynamicRef = dereferencedValue

      const jsonPointer = path.join('')
      if (jsonPointer === '') {
        // flattened = subschema.$ref
      } else {
        const i = jsonPointer.lastIndexOf('/')
        const parentJSONPointer = jsonPointer.slice(0, i) as JSONPointer
        const key = jsonPointer.slice(i + 1)
        const parent = evaluateJSONPointer(parentJSONPointer, document)

        dynamicReferences.set(subschema as { $dynamicRef: any }, {
          document,
          path,
          parent,
          key,
          dereferencedValue
        })
      }

      collectReferences(dereferencedValue, [...path, '/$dynamicRef'], document)
    }

    // detect $refs in non-standard locations
    // TODO: create visitProperties() (excluding subschemas)
    // TODO: this is a fluke that definitions is counted as a plain keyword, it is incorrectly assuming 2020_12
    for (const keyword in subschema) {
      if (isPlainKeyword(keyword)) {
        const value = subschema[keyword]
        if (
          typeof value === 'object' &&
          '$ref' in value &&
          typeof value.$ref === 'string' &&
          Object.keys(value).length === 1 // don't support $ref with siblings in non-standard locations
        ) {
          const dereferencedValue = dereferenceNonStandardReference(value as { $ref: string }, subschema)
          // subschema[keyword] = dereferencedValue
          subschema[keyword].$ref = dereferencedValue

          references.set(value, {
            metaSchemaURI: index.metaSchemaURIForSchema(subschema),
            parent: subschema,
            key: keyword,
            dereferencedValue
          })
        }
      }
    }
  }

  for (const documentURI of index.documentURIs()) {
    const indexedDocument = index.find(documentURI, { followReferences: false })
    visitSubschemas(defaultMetaSchemaURI)(indexedDocument, (subschema, path) => {
      collectReferences(subschema, path, indexedDocument)
    })
  }

  const mergeReferenceWithSiblings = ({
    metaSchemaURI,
    reference,
    dereferencedValue
  }: {
    metaSchemaURI: string
    reference: { $ref: any }
    dereferencedValue: any
  }) => {
    if (references.has(dereferencedValue)) {
      dereferencedValue = mergeReferenceWithSiblings({
        reference: dereferencedValue,
        ...references.get(dereferencedValue)
      })
      // reference['$ref'] = dereferencedValue
    }

    const { $ref, ...siblings } = reference
    const target = {}
    mergeReferenceInto(metaSchemaURI)(target, dereferencedValue, siblings, referenceMergePolicy)
    return target
  }

  // merge $ref into parent
  references.forEach(({ metaSchemaURI, parent, key, dereferencedValue }, reference) => {
    if (Object.keys(reference).length === 1) {
      parent[key] = dereferencedValue
    } else {
      // detect $ref to self
      if (reference === dereferencedValue) {
        delete reference['$ref']
        parent[key] = reference
        return
      }

      parent[key] = mergeReferenceWithSiblings({ metaSchemaURI, reference, dereferencedValue })
    }
  })

  // replace dynamic anchors with outermost value
  dynamicReferences.forEach(({ document, path, parent, key, dereferencedValue }, reference) => {
    let outermost = document
    for (const jsonPointer of ['', ...path]) {
      outermost =
        jsonPointer === '$ref' && !('$ref' in outermost) ? outermost : evaluateJSONPointer(jsonPointer, outermost)

      if (
        typeof outermost === 'object' &&
        '$dynamicAnchor' in outermost &&
        outermost.$dynamicAnchor === dereferencedValue.$dynamicAnchor
      ) {
        dereferencedValue = outermost
        break
      }

      if (typeof outermost === 'object' && '$id' in outermost) {
        const outermostBaseURI = index.baseURIForSchema(outermost) ?? index.baseURIForSchema(document)
        const outermostURI = resolveURIReference(outermost.$id, outermostBaseURI)
        const anchorURI = resolveURIReference(`#${dereferencedValue.$dynamicAnchor}`, outermostURI)
        const outermostAnchor = index.find(anchorURI, { followReferences: false })
        if (outermostAnchor) {
          dereferencedValue = outermostAnchor
          break
        }
      }
    }

    parent[key] = dereferencedValue
  })

  const indexedSchema = index.root()
  if (typeof indexedSchema === 'object' && '$ref' in indexedSchema && Object.keys(indexedSchema).length === 1) {
    return indexedSchema.$ref
  }
  return indexedSchema
}
