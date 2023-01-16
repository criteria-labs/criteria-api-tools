/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import selfDereferenced from './self/dereferenced'
import selfSchema from './self/schema.json'

describe('Schema with circular $refs that extend each other', () => {
  describe('$ref to self', () => {
    it('dereferenceJSONSchema()', async () => {
      const output = dereferenceJSONSchema(selfSchema as any, {
        baseURI: resolve(__dirname, 'self/schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(selfDereferenced)
    })
  })
})
