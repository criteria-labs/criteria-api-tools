import { metaSchemaIDDraft04, metaSchemaIDDraft2020_12 } from '@criteria/json-schema'
import {
  dereferenceOpenAPI as dereferenceOpenAPIWithConfiguration,
  type AsyncDereferenceOptions,
  type DereferenceOptions
} from './dereferencing/dereferenceOpenAPI'
import { DereferencedOpenAPI as DereferencedOpenAPIv3_0, OpenAPI as OpenAPIv3_0 } from './specification/v3.0'
import {
  DereferencedOpenAPI as DereferencedOpenAPIv3_1,
  OpenAPI as OpenAPIv3_1,
  jsonSchemaDialect
} from './specification/v3.1'
import type { MaybePromise } from './util/promises'

export {
  dereferenceOpenAPI as dereferenceOpenAPIv3_0,
  isOpenAPI as isOpenAPIv3_0,
  visitOpenAPIObjects as visitOpenAPIObjectsV3_0
} from './specification/v3.0'
export {
  dereferenceOpenAPI as dereferenceOpenAPIv3_1,
  isOpenAPI as isOpenAPIv3_1,
  visitOpenAPIObjects as visitOpenAPIObjectsV3_1
} from './specification/v3.1'
export { OpenAPIv3_0, OpenAPIv3_1 }

function defaultJSONSchemaDialectForOpenAPIVersion(version: string) {
  if (/3\.1\.\d+/.test(version)) {
    return jsonSchemaDialect
  } else if (/3\.0\.(0|1|2|3)/.test(version)) {
    return metaSchemaIDDraft04
  } else {
    // Assume 3.1.0 if not recognized
    return jsonSchemaDialect
  }
}

export function dereferenceOpenAPI<OpenAPI extends OpenAPIv3_0 | OpenAPIv3_1>(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect' | 'retrieve'>
): OpenAPI extends OpenAPIv3_0 ? DereferencedOpenAPIv3_0 : DereferencedOpenAPIv3_1
export function dereferenceOpenAPI<OpenAPI extends OpenAPIv3_0 | OpenAPIv3_1>(
  openAPI: OpenAPI,
  options?: Omit<AsyncDereferenceOptions, 'defaultJSONSchemaDialect'>
): Promise<OpenAPI extends OpenAPIv3_0 ? DereferencedOpenAPIv3_0 : DereferencedOpenAPIv3_1>
export function dereferenceOpenAPI<OpenAPI extends OpenAPIv3_0 | OpenAPIv3_1>(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions, 'defaultJSONSchemaDialect'>
): OpenAPI extends OpenAPIv3_0 ? DereferencedOpenAPIv3_0 : DereferencedOpenAPIv3_1

export function dereferenceOpenAPI<OpenAPI extends OpenAPIv3_0 | OpenAPIv3_1>(
  openAPI: OpenAPI,
  options?: Omit<DereferenceOptions | AsyncDereferenceOptions, 'defaultJSONSchemaDialect'>
): MaybePromise<OpenAPI extends OpenAPIv3_0 ? DereferencedOpenAPIv3_0 : DereferencedOpenAPIv3_1> {
  return dereferenceOpenAPIWithConfiguration(openAPI, {
    ...options,
    defaultJSONSchemaDialect: defaultJSONSchemaDialectForOpenAPIVersion(openAPI.openapi)
  })
}
