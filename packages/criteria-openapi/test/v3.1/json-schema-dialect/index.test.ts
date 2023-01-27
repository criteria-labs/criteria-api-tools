/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.1'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('OpenAPI that specifies an explicit JSON Schema dialect', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceOpenAPI(openAPI as any) as any
    expect(output).toEqual(dereferenced)
  })
})
