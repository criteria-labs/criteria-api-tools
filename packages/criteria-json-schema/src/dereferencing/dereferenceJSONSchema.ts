import { SchemaIndex, SchemaIndexConfiguration } from '../schema-index/SchemaIndex'
import { URI } from '../util/uri'
import { dereferenceReferences } from './dereferenceReferences'
import { ReferenceMergePolicy, mergeReference } from './mergeReference'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type DereferenceOptions = SchemaIndexConfiguration & {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
}

export function dereferenceJSONSchema(rootSchema: any, options: DereferenceOptions) {
  // Index root schema
  const index = new SchemaIndex({
    cloned: true,
    retrieve: options?.retrieve,
    defaultMetaSchemaURI: options.defaultMetaSchemaURI
  })
  index.addRootSchema(rootSchema, options.baseURI ?? '')

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
}
