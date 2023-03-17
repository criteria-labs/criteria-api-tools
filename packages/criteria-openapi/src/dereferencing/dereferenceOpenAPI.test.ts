/* eslint-env jest */
import { dereferenceOpenAPI } from './dereferenceOpenAPI'
import { OpenAPI } from '../specification/v3.0'

describe('dereferenceOpenAPI()', () => {
  test('dereferenced object is a copy', () => {
    const document: OpenAPI = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {}
    }

    const dereferencedDocument = dereferenceOpenAPI(document)

    expect(dereferencedDocument).toEqual(document)
    expect(dereferencedDocument).not.toBe(document)
  })

  test('dereferenced object has same identity', () => {
    const document: OpenAPI = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          Object: {
            title: 'Object'
          },
          Reference: {
            $ref: '#/components/schemas/Object'
          }
        }
      }
    }

    const dereferencedDocument = dereferenceOpenAPI(document)

    expect(dereferencedDocument.components.schemas.Object).toBeDefined()
    expect(dereferencedDocument.components.schemas.Object).toBe(dereferencedDocument.components.schemas.Reference)
  })

  test('chained references are dereferenced', () => {
    const document: OpenAPI = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          Object: {
            title: 'Object'
          },
          Reference: {
            $ref: '#/components/schemas/Object'
          },
          Reference2: {
            $ref: '#/components/schemas/Reference'
          }
        }
      }
    }

    const dereferencedDocument = dereferenceOpenAPI(document)

    expect(dereferencedDocument.components.schemas.Object).toBeDefined()
    expect(dereferencedDocument.components.schemas.Object).toBe(dereferencedDocument.components.schemas.Reference)
    expect(dereferencedDocument.components.schemas.Object).toBe(dereferencedDocument.components.schemas.Reference2)
  })

  test('array elements are dereferenced', () => {
    const document: OpenAPI = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          Object: {
            title: 'Object'
          },
          Reference: {
            allOf: [
              {
                $ref: '#/components/schemas/Object'
              }
            ]
          }
        }
      }
    }

    const dereferencedDocument = dereferenceOpenAPI(document)

    expect(dereferencedDocument.components.schemas.Object).toBeDefined()
    expect(dereferencedDocument.components.schemas.Object).toBe(
      dereferencedDocument.components.schemas.Reference.allOf[0]
    )
  })

  test('recursive references are dereferenced', () => {
    const document: OpenAPI = {
      openapi: '3.0.3',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {},
      components: {
        schemas: {
          Object: {
            title: 'Object',
            properties: {
              recursive: {
                $ref: '#/components/schemas/Object'
              }
            }
          }
        }
      }
    }

    const dereferencedDocument = dereferenceOpenAPI(document)

    expect(dereferencedDocument.components.schemas.Object).toBeDefined()
    expect(dereferencedDocument.components.schemas.Object).toBe(
      dereferencedDocument.components.schemas.Object.properties.recursive
    )
  })

  describe('schemas dereferenced', () => {
    test.only('schema dereferenced from operation response', () => {
      const document: OpenAPI = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        paths: {
          '/endpoint': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Object'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            Object: {
              title: 'Object'
            }
          }
        }
      }

      const dereferencedDocument = dereferenceOpenAPI(document)

      const responseSchema =
        dereferencedDocument.paths['/endpoint']['get'].responses['200'].content['application/json'].schema
      const componentSchema = dereferencedDocument.components.schemas.Object

      expect(responseSchema).toBeDefined()
      expect(componentSchema).toBeDefined()
      expect(responseSchema).toBe(componentSchema)
    })
  })
})
