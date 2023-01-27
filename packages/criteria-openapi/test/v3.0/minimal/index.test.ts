/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.0'
import openAPI from './openapi.json'
import dereferenced from './dereferenced'

describe('Minimal OpenAPI', () => {
  test('dereferenceOpenAPI()', () => {
    const output = dereferenceOpenAPI(openAPI as any)
    expect(output).toEqual(dereferenced)
  })
})
