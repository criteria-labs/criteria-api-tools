/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with deeply-nested circular $refs', () => {
  describe('dereferenceJSONSchema()', () => {
    test('synchronous', () => {
      const output = dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(dereferenced)

      // Reference equality
      expect(output.definitions.name).toBe(output.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.level3.properties.name)
      expect(output.definitions.name).toBe(
        output.properties.level1.properties.level2.properties.level3.properties.level4.properties.name
      )
    })
    test('asynchronous', async () => {
      const output = (await dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: async (uri) => await retrieveFromFilesystem(uri)
      })) as any
      expect(output).toEqual(dereferenced)

      // Reference equality
      expect(output.definitions.name).toBe(output.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.name)
      expect(output.definitions.name).toBe(output.properties.level1.properties.level2.properties.level3.properties.name)
      expect(output.definitions.name).toBe(
        output.properties.level1.properties.level2.properties.level3.properties.level4.properties.name
      )
    })
  })
})
