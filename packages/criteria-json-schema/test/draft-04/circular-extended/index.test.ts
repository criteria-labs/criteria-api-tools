/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceJSONSchema } from '../../../src/draft-04'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import selfDereferenced from './self/dereferenced'
import selfSchema from './self/schema.json'
import ancestorDereferenced from './ancestor/dereferenced'
import ancestorSchema from './ancestor/schema.json'
import indirectDereferenced from './indirect/dereferenced'
import indirectSchema from './indirect/schema.json'
import indirectAncestorDereferenced from './indirect-ancestor/dereferenced'
import indirectAncestorSchema from './indirect-ancestor/schema.json'

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
  describe('$ref to ancestor', () => {
    it('dereferenceJSONSchema()', async () => {
      const output = dereferenceJSONSchema(ancestorSchema as any, {
        baseURI: resolve(__dirname, 'ancestor/schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(ancestorDereferenced)

      // Reference equality
      expect(output.definitions.person.properties.spouse.properties).toBe(output.definitions.person.properties)
      expect(output.definitions.person.properties.pet.properties).toBe(output.definitions.pet.properties)
    })
  })
  describe('indirect circular $refs', () => {
    it('dereferenceJSONSchema()', async () => {
      const output = dereferenceJSONSchema(indirectSchema as any, {
        baseURI: resolve(__dirname, 'indirect/schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(indirectDereferenced)

      // Reference equality
      expect(output.definitions.parent.properties.children.items.properties).toBe(output.definitions.child.properties)
      expect(output.definitions.child.properties.parents.items.properties).toBe(output.definitions.parent.properties)
      expect(output.definitions.child.properties.pet.properties).toBe(output.definitions.pet.properties)
    })
  })
  describe('indirect circular and ancestor $refs', () => {
    it('dereferenceJSONSchema()', async () => {
      const output = dereferenceJSONSchema(indirectAncestorSchema as any, {
        baseURI: resolve(__dirname, 'indirect-ancestor/schema.json'),
        retrieve: retrieveFromFilesystem
      }) as any
      expect(output).toEqual(indirectAncestorDereferenced)

      // Reference equality
      expect(output.definitions.parent.properties.child.properties).toBe(output.definitions.child.properties)
      expect(output.definitions.child.properties.children.items.properties).toBe(output.definitions.child.properties)
      expect(output.definitions.pet.properties).toBe(output.definitions.child.properties.pet.properties)
    })
  })
})
