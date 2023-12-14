import { dereferenceReferences, mergeReference } from '@criteria/json-schema'
import { OpenAPIIndex, OpenAPIIndexConfiguration } from '../openapi-index/OpenAPIIndex'
import { URI } from '../util/uri'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export type DereferenceOptions = OpenAPIIndexConfiguration & {
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy // needed?
}

export function dereferenceOpenAPI(openAPI: any, options?: DereferenceOptions) {
  // Index root document
  const index = new OpenAPIIndex({
    cloned: true,
    retrieve: options?.retrieve,
    defaultJSONSchemaDialect: options?.defaultJSONSchemaDialect
  })
  index.addRootOpenAPI(openAPI, options?.baseURI ?? '')

  openAPI = index.root()

  const referenceMergePolicy = options?.referenceMergePolicy ?? defaultReferenceMergePolicy
  dereferenceReferences(openAPI, index.references, index, (reference, info, dereferencedValue) => {
    const { summary, description, ...rest } = reference as any
    const merged = mergeReference(rest, info, dereferencedValue, referenceMergePolicy) as any
    if (summary) {
      merged.summary = summary
    }
    if (description) {
      merged.description = description
    }
    return merged
  })

  return index.root()
}
