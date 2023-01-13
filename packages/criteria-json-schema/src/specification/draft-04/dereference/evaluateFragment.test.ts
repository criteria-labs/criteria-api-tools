/* eslint-env jest */
import { evaluateFragment } from './evaluateFragment'
import { JSONSchema } from '../JSONSchema'

const schema: JSONSchema = {
  id: 'http://example.com/root.json',
  definitions: {
    A: { id: '#foo' },
    B: {
      id: 'other.json',
      definitions: {
        X: { id: '#bar' },
        Y: { id: 't/inner.json' }
      }
    },
    C: {
      id: 'urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f'
    },

    ' ': { id: '#space' },
    '%20': { id: '#percent-20' },
    '#': { id: '#hash' },
    '%23': { id: '#percent-23' },
    '~': { id: '#tilde' },
    '/': { id: '#slash' },
    '~0': { id: '#tilde-0' },
    '~1': { id: '#tilde-1' }
  }
}

describe('evaluateFragment()', () => {
  test('evaluates json pointers', () => {
    expect(evaluateFragment('', schema)).toEqual(schema)
    expect(evaluateFragment('/definitions/A', schema)).toEqual(schema.definitions.A)
    expect(evaluateFragment('/definitions/B', schema)).toEqual(schema.definitions.B)
    expect(evaluateFragment('/definitions/B/definitions/X', schema)).toEqual(
      (schema.definitions.B as any).definitions.X
    )
    expect(evaluateFragment('/definitions/B/definitions/Y', schema)).toEqual(
      (schema.definitions.B as any).definitions.Y
    )
    expect(evaluateFragment('/definitions/C', schema)).toEqual(schema.definitions.C)
  })

  test('evaluates local identifiers', () => {
    expect(evaluateFragment('foo', schema)).toEqual({ id: '#foo' })
    expect(evaluateFragment('bar', schema)).toEqual({ id: '#bar' })
  })

  test('returns undefined for non-existent JSON pointer', () => {
    expect(evaluateFragment('/definitions/invalid', schema)).toBeUndefined()
  })

  test('returns undefined for non-existent local identifier', () => {
    expect(evaluateFragment('#invalid', schema)).toBeUndefined()
  })

  test('does not evaluate to schema with uri id', () => {
    // none of these URIs are fragment identifiers
    expect(evaluateFragment('http://example.com/root.json', schema)).toBeUndefined()
    expect(evaluateFragment('http://example.com/other.json', schema)).toBeUndefined()
    expect(evaluateFragment('http://example.com/t/inner.json', schema)).toBeUndefined()
    expect(evaluateFragment('urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f', schema)).toBeUndefined()
    expect(evaluateFragment('other.json', schema)).toBeUndefined()
    expect(evaluateFragment('t/inner.json', schema)).toBeUndefined()
  })

  test('expects fragment to already be uri decoded', () => {
    expect(evaluateFragment('/definitions/ ', schema)).toEqual({ id: '#space' })
    expect(evaluateFragment('/definitions/%20', schema)).toEqual({ id: '#percent-20' })
    expect(evaluateFragment('/definitions/#', schema)).toEqual({ id: '#hash' })
    expect(evaluateFragment('/definitions/%23', schema)).toEqual({ id: '#percent-23' })
  })

  test('decodes JSON pointer encoding', () => {
    expect(evaluateFragment('/definitions/~0', schema)).toEqual({ id: '#tilde' })
    expect(evaluateFragment('/definitions/~1', schema)).toEqual({ id: '#slash' })
    expect(evaluateFragment('/definitions/~00', schema)).toEqual({ id: '#tilde-0' })
    expect(evaluateFragment('/definitions/~01', schema)).toEqual({ id: '#tilde-1' })
  })
})
