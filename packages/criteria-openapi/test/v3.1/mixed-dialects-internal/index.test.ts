/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.1'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('OpenAPI with schemas of different dialects', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceOpenAPI(openAPI as any, {
      baseURI: 'https://example.com/openapi.json'
    }) as any
    expect(output).toEqual(dereferenced)
  })
})
