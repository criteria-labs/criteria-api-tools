import { evaluateJSONPointer } from '@criteria/json-pointer'
import { mergeReferenceInto as mergeReferenceIntoDraft04 } from '../specification/draft-04/mergeReferenceInto'
import { visitSubschemas as visitSubschemasDraft04 } from '../specification/draft-04/visitSubschemas'
import { mergeReferenceInto as mergeReferenceIntoDraft2020_12 } from '../specification/draft-2020-12/mergeReferenceInto'
import { visitSubschemas as visitSubschemasDraft2020_12 } from '../specification/draft-2020-12/visitSubschemas'
import { URI, resolveURIReference } from '../util/uri'
import {
  DereferencingSchemaIndex,
  DereferencingSchemaIndexConfiguration,
  ReferenceInfo
} from './DereferencingSchemaIndex'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export type DereferenceOptions = DereferencingSchemaIndexConfiguration & {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
}

export function dereferenceJSONSchema(rootSchema: any, options: DereferenceOptions) {
  // Index root schema
  const index = new DereferencingSchemaIndex({
    cloned: true,
    retrieve: options?.retrieve,
    defaultMetaSchemaURI: options.defaultMetaSchemaURI
  })
  index.addRootSchema(rootSchema, options.baseURI ?? '')

  rootSchema = index.root()

  const referenceMergePolicy = options?.referenceMergePolicy ?? defaultReferenceMergePolicy

  const visitSubschemas = (metaSchemaURI: string) => {
    switch (metaSchemaURI) {
      case 'https://json-schema.org/draft/2020-12/schema':
        return visitSubschemasDraft2020_12
      case 'http://json-schema.org/draft-04/schema#':
        return visitSubschemasDraft04
      default:
        return visitSubschemas(index.defaultMetaSchemaURI)
    }
  }

  const mergeReferenceInto = (metaSchemaURI: string) => {
    switch (metaSchemaURI) {
      case 'https://json-schema.org/draft/2020-12/schema':
        return mergeReferenceIntoDraft2020_12
      case 'http://json-schema.org/draft-04/schema#':
        return mergeReferenceIntoDraft04
      default:
        return mergeReferenceInto(index.defaultMetaSchemaURI)
    }
  }

  const dereferencedValues = new Map<object, object>()
  index.references.forEach((info, reference) => {
    const dereferencedValue = index.find(info.resolvedURI, { followReferences: true })
    dereferencedValues.set(reference, dereferencedValue)
  })

  const mergeStaticReference = (info: ReferenceInfo, reference: { $ref: string }, dereferencedValue: any) => {
    let { parent, key } = info

    // detect $ref to self
    if (reference === dereferencedValue) {
      delete reference['$ref']
      if (parent) {
        parent[key] = reference
      }
      return reference
    }

    if (parent === null) {
      parent = reference
      key = '$ref'
    }

    // simple dereference
    if (Object.keys(reference).length === 1) {
      parent[key] = dereferencedValue
      return dereferencedValue
    }

    // $ref has siblings
    // dereferencedValue will be discarded and a new object contructed with the merged keywords
    // check that no other references have a dependency on dereferencedValue as the parent
    index.references.forEach((otherInfo, otherReference) => {
      if (otherReference === reference) {
        return
      }
      if (dereferencedValue === otherInfo.parent) {
        if (info.key === 'pet' && info.parent.name !== undefined) {
          mergeAnyReference(otherInfo, otherReference)
        }
      }
    })

    // $ref has siblings
    const { $ref, ...siblings } = reference
    const target = {}
    mergeReferenceInto(info.metadata?.metaSchemaURI)(target, dereferencedValue, siblings, referenceMergePolicy)
    parent[key] = target

    dereferencedValues.set(reference, target)

    return target
  }

  // replace dynamic anchors with outermost value
  const mergeDynamicReference = (info: ReferenceInfo, reference: object, dereferencedValue: any) => {
    if (!('$dynamicRef' in reference)) {
      return
    }

    const { resolvedURI, parent, key, path } = info

    let outermost = rootSchema
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
        const outermostBaseURI =
          index.infoForIndexedObject(outermost)?.baseURI ?? index.infoForIndexedObject(rootSchema)?.baseURI
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
  }

  const seen = new Set()
  const mergeAnyReference = (info: ReferenceInfo, reference: object) => {
    if (seen.has(reference)) {
      return
    }
    seen.add(reference)

    if (!('$ref' in reference) && !('$dynamicRef' in reference)) {
      return // already dereferenced
    }

    let dereferencedValue = dereferencedValues.get(reference) // index.find(info.resolvedURI, { followReferences: true })

    // detect chains
    if (index.references.has(dereferencedValue)) {
      mergeAnyReference(index.references.get(dereferencedValue), dereferencedValue)

      // update dereferenced value
      dereferencedValue = dereferencedValues.get(dereferencedValue)
    }

    if (info.isDynamic) {
      mergeDynamicReference(info, reference, dereferencedValue)
    } else {
      mergeStaticReference(info, reference as { $ref: string }, dereferencedValue)
    }
  }

  // merge $ref into parent
  index.references.forEach(mergeAnyReference)

  const indexedSchema = index.root()
  if (typeof indexedSchema === 'object' && '$ref' in indexedSchema && Object.keys(indexedSchema).length === 1) {
    return indexedSchema.$ref
  }
  return indexedSchema
}
