/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import schema from './schema.json'
import dereferenced from './dereferenced'
import { resolve } from 'path'

describe('Schema with a top-level (root) $ref', () => {
  it('dereferenceJSONSchema()', async () => {
    const output = dereferenceJSONSchema(schema as any, {
      baseURI: resolve(__dirname, 'schema.json'),
      retrieve: retrieveFromFilesystem
    }) as any
    expect(output).toEqual(dereferenced)

    // Reference equality
    expect(output.properties.first).toBe(output.properties.last)
  })
})
