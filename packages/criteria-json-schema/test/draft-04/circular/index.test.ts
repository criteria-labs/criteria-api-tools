/* eslint-env jest */
import { dereferenceJSONSchema } from '../../../src/draft-04'
import selfSchema from './self/schema.json'
import selfDereferenced from './self/dereferenced'
import ancestorSchema from './ancestor/schema.json'
import ancestorDereferenced from './ancestor/dereferenced'
import indirectSchema from './indirect/schema.json'
import indirectDereferenced from './indirect/dereferenced'
import indirectAncestorSchema from './indirect-ancestor/schema.json'
import indirectAncestorDereferenced from './indirect-ancestor/dereferenced'
import cyclicEqual from '../../util/cyclicEqual'

describe('Schema with circular (recursive) $refs', () => {
  describe('$ref to self', () => {
    describe('dereferenceJSONSchema()', () => {
      test('should dereference', () => {
        const output = dereferenceJSONSchema(selfSchema as any)
        expect(output).toEqual(selfDereferenced)

        // Reference equality
        expect(output.definitions.child.properties.pet).toBe(output.definitions.pet)
      })
      test('should double dereference', () => {
        const output1 = dereferenceJSONSchema(selfSchema as any)
        const output2 = dereferenceJSONSchema(output1)
        expect(output2).toEqual(selfDereferenced)

        // Reference equality
        expect(output2.definitions.child.properties.pet).toBe(output2.definitions.pet)
      })
    })
  })

  describe('$ref to ancestor', () => {
    describe('dereferenceJSONSchema()', () => {
      test('should dereference', () => {
        const output = dereferenceJSONSchema(ancestorSchema as any)
        expect(cyclicEqual(output, ancestorDereferenced)).toBe(true)

        // Reference equality
        expect(output.definitions.person.properties.spouse).toBe(output.definitions.person)
        expect(output.definitions.person.properties.pet).toBe(output.definitions.pet)
      })
      test('should double dereference', () => {
        const output1 = dereferenceJSONSchema(ancestorSchema as any)
        const output2 = dereferenceJSONSchema(output1)
        expect(cyclicEqual(output2, ancestorDereferenced)).toBe(true)

        // Reference equality
        expect(output2.definitions.person.properties.spouse).toBe(output2.definitions.person)
        expect(output2.definitions.person.properties.pet).toBe(output2.definitions.pet)
      })
    })
  })

  describe('indirect circular $refs', () => {
    describe('dereferenceJSONSchema()', () => {
      test('should dereference', () => {
        const output = dereferenceJSONSchema(indirectSchema as any)
        expect(output).toEqual(indirectDereferenced)

        // Reference equality
        expect(output.definitions.parent.properties.children.items).toBe(output.definitions.child)
        expect(output.definitions.child.properties.parents.items).toBe(output.definitions.parent)
      })
      test('should double dereference', () => {
        const output1 = dereferenceJSONSchema(indirectSchema as any)
        const output2 = dereferenceJSONSchema(output1)
        expect(output2).toEqual(indirectDereferenced)

        // Reference equality
        expect(output2.definitions.parent.properties.children.items).toBe(output2.definitions.child)
        expect(output2.definitions.child.properties.parents.items).toBe(output2.definitions.parent)
      })
    })
  })

  describe('indirect circular and ancestor $refs', () => {
    describe('dereferenceJSONSchema()', () => {
      test('should dereference', () => {
        const output = dereferenceJSONSchema(indirectAncestorSchema as any)
        expect(output).toEqual(indirectAncestorDereferenced)

        // Reference equality
        expect(output.definitions.parent.properties.child).toBe(output.definitions.child)
        expect(output.definitions.child.properties.children.items).toBe(output.definitions.child)
      })
      test('should double dereference', () => {
        const output1 = dereferenceJSONSchema(indirectAncestorSchema as any)
        const output2 = dereferenceJSONSchema(output1)
        expect(output2).toEqual(indirectAncestorDereferenced)

        // Reference equality
        expect(output2.definitions.parent.properties.child).toBe(output2.definitions.child)
        expect(output2.definitions.child.properties.children.items).toBe(output2.definitions.child)
      })
    })
  })
})
