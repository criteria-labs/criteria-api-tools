/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-2020-12'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with a boolean subschema', () => {
  describe('dereferenceJSONSchema()', () => {
    test('synchronous', () => {
      const output = dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(dereferenced)
    })
    test('asynchronous', async () => {
      const output = (await dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: async (uri) => await retrieveFromFilesystem(uri)
      })) as any
      expect(output).toEqual(dereferenced)
    })
  })
})
