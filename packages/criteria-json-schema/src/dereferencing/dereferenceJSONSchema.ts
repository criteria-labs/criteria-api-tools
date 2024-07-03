import { SchemaIndex } from '../schema-index/SchemaIndex'
import { MaybePromise, chain } from '../util/promises'
import { URI } from '../util/uri'
import { dereferenceReferences } from './dereferenceReferences'
import { ReferenceMergePolicy, mergeReference } from './mergeReference'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type DereferenceOptions = {
  defaultMetaSchemaID: URI
  cloned?: boolean
  retrieve?: (uri: URI) => any
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
}

export type AsyncDereferenceOptions = Omit<DereferenceOptions, 'retrieve'> & {
  retrieve?: (uri: URI) => Promise<any>
}

export function dereferenceJSONSchema(
  rootSchema: any,
  options: DereferenceOptions | AsyncDereferenceOptions
): MaybePromise<any> {
  // Index root schema
  const index = new SchemaIndex({
    cloned: true,
    retrieve: options?.retrieve,
    defaultMetaSchemaID: options.defaultMetaSchemaID
  })
  const addRootSchemaResult = index.addRootSchema(rootSchema, options.baseURI ?? '')
  return chain(addRootSchemaResult, () => {
    rootSchema = index.root()

    const referenceMergePolicy = options?.referenceMergePolicy ?? defaultReferenceMergePolicy
    dereferenceReferences(rootSchema, index.references, index, (reference, info, dereferencedValue) => {
      return mergeReference(reference, info, dereferencedValue, referenceMergePolicy)
    })

    const root = index.root()
    if (typeof root === 'object' && '$ref' in root && Object.keys(root).length === 1) {
      return root.$ref
    }
    return root
  })
}
