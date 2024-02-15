import { hash } from './hash'

describe('hash()', () => {
  describe('direct circular object', () => {
    test('does not throw', () => {
      const root: any = {}
      root.self = root

      const value = hash(root)
      expect(value).toBe('{"self":"[Circular]"}')
    })
  })
  describe('indirect circular object', () => {
    test('does not throw', () => {
      const root: any = {}
      root.child = { root }

      const value = hash(root)
      expect(value).toBe('{"child":{"root":"[Circular]"}}')
    })
  })
})
