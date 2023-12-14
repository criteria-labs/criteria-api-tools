import { metaSchemaURI } from '@criteria/json-schema/draft-04'
import {
  DereferenceOptions,
  dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration
} from '../../dereferencing/dereferenceOpenAPI'
import { DereferencedOpenAPI, OpenAPI } from './types/OpenAPI'

export function dereferenceOpenAPI(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect'>
): DereferencedOpenAPI {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultJSONSchemaDialect: metaSchemaURI
  })
}
