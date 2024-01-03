import { dereferenceReferences, mergeReference } from '@criteria/json-schema'
import { OpenAPIIndex } from '../openapi-index/OpenAPIIndex'
import { MaybePromise, chain } from '../util/promises'
import { URI } from '../util/uri'

// default options
export const defaultReferenceMergePolicy = 'by_keyword'

export type ReferenceMergePolicy = 'by_keyword' | 'overwrite' | 'none' | 'default'

export type DereferenceOptions = {
  defaultJSONSchemaDialect?: URI
  cloned?: boolean
  retrieve?: (uri: URI) => any
  baseURI?: URI
  referenceMergePolicy?: ReferenceMergePolicy
}

export type AsyncDereferenceOptions = Omit<DereferenceOptions, 'retrieve'> & {
  retrieve?: (uri: URI) => Promise<any>
}

export function dereferenceOpenAPI(
  openAPI: any,
  options?: DereferenceOptions | AsyncDereferenceOptions
): MaybePromise<any> {
  // Index root document
  const index = new OpenAPIIndex({
    cloned: true,
    retrieve: options?.retrieve,
    defaultJSONSchemaDialect: options?.defaultJSONSchemaDialect
  })
  const addRootOpenAPIResult = index.addRootOpenAPI(openAPI, options?.baseURI ?? '')
  return chain(addRootOpenAPIResult, () => {
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
  })
}
