/* eslint-env jest */
import { dereferenceOpenAPI } from '../../../src/v3.0'
import ancestorDereferenced from './ancestor/dereferenced'
import ancestorOpenAPI from './ancestor/openapi.json'
import indirectAncestorDereferenced from './indirect-ancestor/dereferenced'
import indirectAncestorOpenAPI from './indirect-ancestor/openapi.json'
import indirectDereferenced from './indirect/dereferenced'
import indirectOpenAPI from './indirect/openapi.json'
import selfDereferenced from './self/dereferenced'
import selfOpenAPI from './self/openapi.json'

describe('OpenAPI with circular (recursive) $refs', () => {
  describe('$ref to self', () => {
    describe('dereferenceOpenAPI()', () => {
      test('should dereference', () => {
        const output = dereferenceOpenAPI(selfOpenAPI as any)
        expect(output).toEqual(selfDereferenced)

        // Reference equality
        expect(output.components?.schemas?.child.properties?.pet).toBeDefined()
        expect(output.components?.schemas?.child.properties?.pet).toBe(output.components?.schemas?.pet)
      })
      test('should double dereference', () => {
        const output1 = dereferenceOpenAPI(selfOpenAPI as any)
        const output2 = dereferenceOpenAPI(output1)
        expect(output2).toEqual(selfDereferenced)

        // Reference equality
        expect(output2.components?.schemas?.child.properties?.pet).toBeDefined()
        expect(output2.components?.schemas?.child.properties?.pet).toBe(output2.components?.schemas?.pet)
      })
    })
  })

  describe('$ref to ancestor', () => {
    describe('dereferenceOpenAPI()', () => {
      test('should dereference', () => {
        const output = dereferenceOpenAPI(ancestorOpenAPI as any)
        expect(output).toCircularEqual(ancestorDereferenced)

        // Reference equality
        expect(output.components?.schemas?.person.properties?.spouse).toBeDefined()
        expect(output.components?.schemas?.person.properties?.spouse).toBe(output.components?.schemas?.person)
        expect(output.components?.schemas?.person.properties?.pet).toBeDefined()
        expect(output.components?.schemas?.person.properties?.pet).toBe(output.components?.schemas?.pet)
      })
      test('should double dereference', () => {
        const output1 = dereferenceOpenAPI(ancestorOpenAPI as any)
        const output2 = dereferenceOpenAPI(output1)
        expect(output2).toCircularEqual(ancestorDereferenced)

        // Reference equality
        expect(output2.components?.schemas?.person.properties?.spouse).toBeDefined()
        expect(output2.components?.schemas?.person.properties?.spouse).toBe(output2.components?.schemas?.person)
        expect(output2.components?.schemas?.person.properties?.pet).toBeDefined()
        expect(output2.components?.schemas?.person.properties?.pet).toBe(output2.components?.schemas?.pet)
      })
    })
  })

  describe('indirect circular $refs', () => {
    describe('dereferenceOpenAPI()', () => {
      test('should dereference', () => {
        const output = dereferenceOpenAPI(indirectOpenAPI as any)
        expect(output).toEqual(indirectDereferenced)

        // Reference equality
        expect(output.components?.schemas?.parent.properties?.children.items).toBeDefined()
        expect(output.components?.schemas?.parent.properties?.children.items).toBe(output.components?.schemas?.child)
        expect(output.components?.schemas?.child.properties?.parents.items).toBeDefined()
        expect(output.components?.schemas?.child.properties?.parents.items).toBe(output.components?.schemas?.parent)
      })
      test('should double dereference', () => {
        const output1 = dereferenceOpenAPI(indirectOpenAPI as any)
        const output2 = dereferenceOpenAPI(output1)
        expect(output2).toEqual(indirectDereferenced)

        // Reference equality
        expect(output2.components?.schemas?.parent.properties?.children.items).toBeDefined()
        expect(output2.components?.schemas?.parent.properties?.children.items).toBe(output2.components?.schemas?.child)
        expect(output2.components?.schemas?.child.properties?.parents.items).toBeDefined()
        expect(output2.components?.schemas?.child.properties?.parents.items).toBe(output2.components?.schemas?.parent)
      })
    })
  })

  describe('indirect circular and ancestor $refs', () => {
    describe('dereferenceOpenAPI()', () => {
      test('should dereference', () => {
        const output = dereferenceOpenAPI(indirectAncestorOpenAPI as any)
        expect(output).toEqual(indirectAncestorDereferenced)

        // Reference equality
        expect(output.components?.schemas?.parent.properties?.child).toBeDefined()
        expect(output.components?.schemas?.parent.properties?.child).toBe(output.components?.schemas?.child)
        expect(output.components?.schemas?.child.properties?.children.items).toBeDefined()
        expect(output.components?.schemas?.child.properties?.children.items).toBe(output.components?.schemas?.child)
      })
      test('should double dereference', () => {
        const output1 = dereferenceOpenAPI(indirectAncestorOpenAPI as any)
        const output2 = dereferenceOpenAPI(output1)
        expect(output2).toEqual(indirectAncestorDereferenced)

        // Reference equality
        expect(output2.components?.schemas?.parent.properties?.child).toBeDefined()
        expect(output2.components?.schemas?.parent.properties?.child).toBe(output2.components?.schemas?.child)
        expect(output2.components?.schemas?.child.properties?.children.items).toBeDefined()
        expect(output2.components?.schemas?.child.properties?.children.items).toBe(output2.components?.schemas?.child)
      })
    })
  })
})
