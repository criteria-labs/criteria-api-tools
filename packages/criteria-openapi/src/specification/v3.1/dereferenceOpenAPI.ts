import { metaSchemaID } from '@criteria/json-schema/draft-2020-12'
import {
  AsyncDereferenceOptions,
  DereferenceOptions,
  dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration
} from '../../dereferencing/dereferenceOpenAPI'
import { DereferencedOpenAPI, OpenAPI } from './types/OpenAPI'
import { MaybePromise } from '../../util/promises'

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

// TODO: dialect should be OAS
export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultJSONSchemaDialect'>
): MaybePromise<DereferencedOpenAPI> {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultJSONSchemaDialect: metaSchemaID
  })
}
