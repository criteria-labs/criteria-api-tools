/* eslint-env jest */
import { evaluateJSONPointer } from './evaluateJSONPointer'

describe('evaluateJSONPointer()', () => {
  const document = {
    foo: ['bar', 'baz'],
    '': 0,
    'a/b': 1,
    'c%d': 2,
    'e^f': 3,
    'g|h': 4,
    'i\\\\j': 5,
    'k\\"l': 6,
    ' ': 7,
    'm~n': 8
  }

  describe('evaluating to values', () => {
    test('evaluates empty string to the whole document', () => {
      expect(evaluateJSONPointer('', document)).toEqual(document)
    })

    test('evaluates object property', () => {
      expect(evaluateJSONPointer('/foo', document)).toEqual(['bar', 'baz'])
    })

    test('evaluates array index', () => {
      expect(evaluateJSONPointer('/foo/0', document)).toEqual('bar')
    })

    test('evaluates object property that is empty string', () => {
      expect(evaluateJSONPointer('/', document)).toEqual(0)
    })

    test("evaluates object property with '%' character", () => {
      expect(evaluateJSONPointer('/c%d', document)).toEqual(2)
    })

    test("evaluates object property with '^' character", () => {
      expect(evaluateJSONPointer('/e^f', document)).toEqual(3)
    })

    test("evaluates object property with '|' character", () => {
      expect(evaluateJSONPointer('/g|h', document)).toEqual(4)
    })

    test("evaluates object property that is ' ' character", () => {
      expect(evaluateJSONPointer('/ ', document)).toEqual(7)
    })
  })

  describe('escaping reference tokens', () => {
    test("evaluates object property with escaped '/' character", () => {
      expect(evaluateJSONPointer('/a~1b', document)).toEqual(1)
    })

    test("evaluates object property with escaped '~' character", () => {
      expect(evaluateJSONPointer('/m~0n', document)).toEqual(8)
    })

    test("does not unescape backslash-escaped '\\' character", () => {
      expect(evaluateJSONPointer('/i\\\\j', document)).toEqual(5)
    })

    test("does not unescape backslash-escaped '\"' character", () => {
      expect(evaluateJSONPointer('/k\\"l', document)).toEqual(6)
    })
  })

  describe('invalid values', () => {
    test('evaluates to undefined for invalid property', () => {
      expect(evaluateJSONPointer('/invalid/0', document)).toBeUndefined()
    })
  })
})
