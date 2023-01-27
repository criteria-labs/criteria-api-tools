import { dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration } from '../../dereferencing/dereferenceOpenAPI'
import { URI } from '../../util/uri'
import { DereferencedOpenAPI, OpenAPI } from './types/OpenAPI'
import visitorConfiguration from './visitorConfiguration'

interface Options {
  baseURI?: URI
  retrieve?: (uri: URI) => any
  merge?: (dereferencedObject: object, additionalProperties: object) => void
}

export function dereferenceOpenAPI(openAPI: OpenAPI, options?: Options): DereferencedOpenAPI {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultConfiguration: visitorConfiguration({ jsonSchemaDialect: openAPI.jsonSchemaDialect })
  })
}
