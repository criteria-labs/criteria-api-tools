import { URI } from '../util/uri'
import { SchemaIndex, SchemaIndexConfiguration } from '../schema-index/SchemaIndex'
import { dereferenceReferences } from './dereferenceReferences'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

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

  dereferenceReferences(rootSchema, index.references, index, {
    defaultMetaSchemaURI: index.defaultMetaSchemaURI,
    referenceMergePolicy
  })

  const root = index.root()
  if (typeof root === 'object' && '$ref' in root && Object.keys(root).length === 1) {
    return root.$ref
  }
  return root
}
