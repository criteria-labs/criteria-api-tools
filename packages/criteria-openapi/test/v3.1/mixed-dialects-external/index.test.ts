/* eslint-env jest */
import { resolve } from 'path'
import { rewrite } from '../../../src/retrievers'
import { dereferenceOpenAPI } from '../../../src/v3.1'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('OpenAPI with external schemas of different dialects', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceOpenAPI(openAPI as any, {
      baseURI: resolve(__dirname, 'openapi.json'),
      retrieve: rewrite({ 'https://example.com': resolve(__dirname, 'schemas') }, retrieveFromFilesystem)
    }) as any
    expect(output).toEqual(dereferenced)
  })
})
