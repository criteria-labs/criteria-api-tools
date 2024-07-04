import { evaluateJSONPointer, type JSONPointer } from '@criteria/json-pointer'
import { DocumentIndex } from '../schema-index/DocumentIndex'
import { ReferenceInfo } from '../schema-index/types'
import { URI, resolveURIReference } from '../util/uri'

export function dereferenceReferences<Metadata extends { metaSchemaID: URI }>(
  rootObject: any,
  references: Map<object, ReferenceInfo<Metadata>>,
  index: DocumentIndex,
  merge: (reference: { $ref: string }, info: ReferenceInfo<Metadata>, dereferencedValue: any) => object
) {
  const dereferencedValues = new Map<object, object>()
  references.forEach((info, reference) => {
    const dereferencedValue = index.find(info.resolvedURI, { followReferences: true })
    dereferencedValues.set(reference, dereferencedValue)
  })

  const mergeStaticReference = (info: ReferenceInfo<Metadata>, reference: { $ref: string }, dereferencedValue: any) => {
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
    references.forEach((otherInfo, otherReference) => {
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
    // const { $ref, ...siblings } = reference
    const target = merge(reference, info, dereferencedValue)
    // const target = {}
    // mergeReferenceInto(info.metadata?.metaSchemaID)(target, dereferencedValue, siblings, options.referenceMergePolicy)
    parent[key] = target

    dereferencedValues.set(reference, target)

    return target
  }

  // replace dynamic anchors with outermost value
  const mergeDynamicReference = (info: ReferenceInfo<Metadata>, reference: object, dereferencedValue: any) => {
    if (!('$dynamicRef' in reference)) {
      return
    }

    const { resolvedURI, parent, key, path } = info

    let outermost = rootObject
    for (const jsonPointer of ['' as JSONPointer, ...path]) {
      outermost =
        jsonPointer === '/$ref' && !('$ref' in outermost) ? outermost : evaluateJSONPointer(jsonPointer, outermost)

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
          index.infoForIndexedObject(outermost)?.baseURI ?? index.infoForIndexedObject(rootObject)?.baseURI
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
  const mergeAnyReference = (info: ReferenceInfo<Metadata>, reference: object) => {
    if (seen.has(reference)) {
      return
    }
    seen.add(reference)

    if (!('$ref' in reference) && !('$dynamicRef' in reference)) {
      return // already dereferenced
    }

    let dereferencedValue = dereferencedValues.get(reference) // index.find(info.resolvedURI, { followReferences: true })

    // detect chains
    if (references.has(dereferencedValue)) {
      mergeAnyReference(references.get(dereferencedValue), dereferencedValue)

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
  references.forEach(mergeAnyReference)
}
