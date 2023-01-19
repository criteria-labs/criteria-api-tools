/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import schema from './schema.json'
import dereferenced from './dereferenced'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import { resolve } from 'path'
import { rewrite } from '../../../src/retrievers'

describe('Recursive schema extended using $dynamicAnchor at root', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: rewrite({ 'https://example.com': resolve(__dirname, 'definitions') }, retrieveFromFilesystem)
    }) as any
    expect(output).toCircularEqual(dereferenced)

    // Dymamic extension
    expect(output.unevaluatedProperties).toBe(false)
    expect(output.properties.children.items.unevaluatedProperties).toBe(false)
  })
})
