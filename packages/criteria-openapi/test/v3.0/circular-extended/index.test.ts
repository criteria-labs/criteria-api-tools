/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceOpenAPI } from '../../../src/v3.0'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import selfDereferenced from './self/dereferenced'
import selfOpenAPI from './self/openapi.json'
import ancestorDereferenced from './ancestor/dereferenced'
import ancestorOpenAPI from './ancestor/openapi.json'
import indirectDereferenced from './indirect/dereferenced'
import indirectOpenAPI from './indirect/openapi.json'
import indirectAncestorDereferenced from './indirect-ancestor/dereferenced'
import indirectAncestorOpenAPI from './indirect-ancestor/openapi.json'

describe('OpenAPI with circular $refs that extend each other', () => {
  describe('$ref to self', () => {
    it('dereferenceOpenAPI()', async () => {
      const output = dereferenceOpenAPI(selfOpenAPI as any, {
        baseURI: resolve(__dirname, 'self/openapi.json'),
        retrieve: retrieveFromFilesystem,
        merge: Object.assign // keep the test fixtures similar to JSON Schema
      }) as any
      expect(output).toEqual(selfDereferenced)
    })
  })
  describe('$ref to ancestor', () => {
    it('dereferenceOpenAPI()', async () => {
      const output = dereferenceOpenAPI(ancestorOpenAPI as any, {
        baseURI: resolve(__dirname, 'ancestor/openapi.json'),
        retrieve: retrieveFromFilesystem,
        merge: Object.assign // keep the test fixtures similar to JSON Schema
      }) as any
      expect(output).toCircularEqual(ancestorDereferenced)

      // Reference equality
      expect(output.components.schemas.person.properties.spouse.properties).toBe(
        output.components.schemas.person.properties
      )
      expect(output.components.schemas.person.properties.pet.properties).toBe(output.components.schemas.pet.properties)
    })
  })
  describe('indirect circular $refs', () => {
    it('dereferenceOpenAPI()', async () => {
      const output = dereferenceOpenAPI(indirectOpenAPI as any, {
        baseURI: resolve(__dirname, 'indirect/openapi.json'),
        retrieve: retrieveFromFilesystem,
        merge: Object.assign // keep the test fixtures similar to JSON Schema
      }) as any
      expect(output).toCircularEqual(indirectDereferenced)

      // Reference equality
      expect(output.components.schemas.parent.properties.children.items.properties).toBe(
        output.components.schemas.child.properties
      )
      expect(output.components.schemas.child.properties.parents.items.properties).toBe(
        output.components.schemas.parent.properties
      )
      expect(output.components.schemas.child.properties.pet.properties).toBe(output.components.schemas.pet.properties)
    })
  })
  describe('indirect circular and ancestor $refs', () => {
    it('dereferenceOpenAPI()', async () => {
      const output = dereferenceOpenAPI(indirectAncestorOpenAPI as any, {
        baseURI: resolve(__dirname, 'indirect-ancestor/openapi.json'),
        retrieve: retrieveFromFilesystem,
        merge: Object.assign // keep the test fixtures similar to JSON Schema
      }) as any
      expect(output).toCircularEqual(indirectAncestorDereferenced)

      // Reference equality
      expect(output.components.schemas.parent.properties.child.properties).toBe(
        output.components.schemas.child.properties
      )
      expect(output.components.schemas.child.properties.children.items.properties).toBe(
        output.components.schemas.child.properties
      )
      expect(output.components.schemas.pet.properties).toBe(output.components.schemas.child.properties.pet.properties)
    })
  })
})
