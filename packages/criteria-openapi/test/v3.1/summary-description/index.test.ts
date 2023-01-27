/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.1'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('OpenAPI reference that overrides summary and description', () => {
  test('dereferenceOpenAPI()', () => {
    const output = dereferenceOpenAPI(openAPI as any) as any
    expect(output).toEqual(dereferenced)
  })
})
