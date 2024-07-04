import { visitOpenAPIObjects } from './visitOpenAPIObjects'

describe('visitOpenAPIObjects()', () => {
  describe('with invalid OpenAPI document', () => {
    test('should not throw', () => {
      const openAPI = {
        openapi: '3.0.3',
        paths: {
          '/endpoint': null // not an object
        }
      }
      expect(() => {
        visitOpenAPIObjects(openAPI, 'OpenAPI', {}, () => {})
      }).not.toThrow()
    })
  })
})
