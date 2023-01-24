/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import { rewrite } from '../../../src/retrievers'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with internal $refs', () => {
  test('dereferenceJSONSchema()', () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: rewrite({ 'https://example.com': resolve(__dirname, 'definitions') }, retrieveFromFilesystem)
    }) as any
    expect(output).toEqual(dereferenced)
  })
})
