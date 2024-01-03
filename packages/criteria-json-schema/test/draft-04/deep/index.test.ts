import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import schema from './schema.json'

describe('Schema with deeply-nested $refs', () => {
  describe('dereferenceJSONSchema()', () => {
    test('synchronous', () => {
      const output = dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(dereferenced)

      // Reference equality
      expect(output.properties.name.type).toBe(output.properties['level 1'].properties.name.type)
      expect(output.properties.name.type).toBe(output.properties['level 1'].properties['level 2'].properties.name.type)
      expect(output.properties.name.type).toBe(
        output.properties['level 1'].properties['level 2'].properties['level 3'].properties.name.type
      )
      expect(output.properties.name.type).toBe(
        output.properties['level 1'].properties['level 2'].properties['level 3'].properties['level 4'].properties.name
          .type
      )
    })
    test('asynchronous', async () => {
      const output = (await dereferenceJSONSchema(schema as any, {
        baseURI: resolve(__dirname, 'schema.json'),
        retrieve: async (uri) => await retrieveFromFilesystem(uri)
      })) as any
      expect(output).toEqual(dereferenced)

      // Reference equality
      expect(output.properties.name.type).toBe(output.properties['level 1'].properties.name.type)
      expect(output.properties.name.type).toBe(output.properties['level 1'].properties['level 2'].properties.name.type)
      expect(output.properties.name.type).toBe(
        output.properties['level 1'].properties['level 2'].properties['level 3'].properties.name.type
      )
      expect(output.properties.name.type).toBe(
        output.properties['level 1'].properties['level 2'].properties['level 3'].properties['level 4'].properties.name
          .type
      )
    })
  })
})
