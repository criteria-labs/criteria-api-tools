import { metaSchemaURI } from '@criteria/json-schema/draft-2020-12'
import {
  DereferenceOptions,
  dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration
} from '../../dereferencing/dereferenceOpenAPI'
import { DereferencedOpenAPI, OpenAPI } from './types/OpenAPI'

// TODO: dialect should be OAS
export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect'>
): DereferencedOpenAPI {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultJSONSchemaDialect: metaSchemaURI
  })
}
