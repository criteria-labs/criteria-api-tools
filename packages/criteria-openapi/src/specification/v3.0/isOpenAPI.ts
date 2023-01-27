import { OpenAPI } from './types'

export function isOpenAPI(value: any): value is OpenAPI {
  return (
    typeof value === 'object' &&
    'openapi' in value &&
    typeof value['openapi'] === 'string' &&
    value['openapi'].match(/^3\.0\.\d(-.+)?$/) != null
  )
}
