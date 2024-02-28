import { visitOpenAPIObjects } from './visitOpenAPIObjects'

describe('visitOpenAPIObjects()', () => {
  describe('with invalid OpenAPI document', () => {
    test('should not throw', () => {
      const openAPI = {
        openapi: '3.1.0',
        paths: {
          '/endpoint': null // not an object
        }
      }
      expect(() => {
        visitOpenAPIObjects(openAPI, 'openapi', {}, () => {})
      }).not.toThrow()
    })
  })
})
