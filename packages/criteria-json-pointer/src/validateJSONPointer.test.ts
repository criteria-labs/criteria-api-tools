/* eslint-env jest */
import { validateJSONPointer } from './validateJSONPointer'

describe('validateJSONPointer()', () => {
  describe('success', () => {
    test('validates empty string', () => {
      expect(() => validateJSONPointer('')).not.toThrow()
    })

    test('validates object property', () => {
      expect(() => validateJSONPointer('/foo')).not.toThrow()
    })

    test('validates array index', () => {
      expect(() => validateJSONPointer('/foo/0')).not.toThrow()
    })

    test('validates object property that is empty string', () => {
      expect(() => validateJSONPointer('/')).not.toThrow()
    })
  })

  describe('failure', () => {
    test("fails to validate object property that does not start with '\\'", () => {
      expect(() => validateJSONPointer('foo')).toThrow()
    })
  })
})
