/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceOpenAPI } from '../../../src/v3.0'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import dereferenced from './dereferenced'
import openAPI from './openapi.json'

describe('Schema with circular (recursive) external $refs', () => {
  describe('dereferenceJSONSchema()', () => {
    test('synchronous', () => {
      const output = dereferenceOpenAPI(openAPI as any, {
        baseURI: resolve(__dirname, 'openapi.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toCircularEqual(dereferenced)

      // Reference equality
      expect(output.components.schemas.person.properties.spouse).toBe(output.components.schemas.person)
      expect(output.components.schemas.parent.properties.children.items).toBe(output.components.schemas.child)
      expect(output.components.schemas.child.properties.parents.items).toBe(output.components.schemas.parent)
    })
    test('asynchronous', async () => {
      const output = (await dereferenceOpenAPI(openAPI as any, {
        baseURI: resolve(__dirname, 'openapi.json'),
        retrieve: async (uri) => await retrieveFromFilesystem(uri)
      })) as any
      expect(output).toCircularEqual(dereferenced)

      // Reference equality
      expect(output.components.schemas.person.properties.spouse).toBe(output.components.schemas.person)
      expect(output.components.schemas.parent.properties.children.items).toBe(output.components.schemas.child)
      expect(output.components.schemas.child.properties.parents.items).toBe(output.components.schemas.parent)
    })
  })
})
