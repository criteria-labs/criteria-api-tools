/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.1'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('Schema with internal $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceOpenAPI(openAPI as any) as any
    expect(output).toEqual(dereferenced)
  })
})
