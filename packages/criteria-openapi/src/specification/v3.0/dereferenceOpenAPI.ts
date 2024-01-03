import { metaSchemaURI } from '@criteria/json-schema/draft-04'
import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration
} from '../../dereferencing/dereferenceOpenAPI'
import { MaybePromise } from '../../util/promises'
import { DereferencedOpenAPI, OpenAPI } from './types/OpenAPI'

export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect' | 'retrieve'>
): DereferencedOpenAPI
export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<AsyncDereferenceOptions, 'defaultJSONSchemaDialect'>
): Promise<DereferencedOpenAPI>
export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect'>
): DereferencedOpenAPI

export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultJSONSchemaDialect'>
): MaybePromise<DereferencedOpenAPI> {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultJSONSchemaDialect: metaSchemaURI
  })
}
