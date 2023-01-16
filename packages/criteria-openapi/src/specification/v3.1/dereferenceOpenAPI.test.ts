/* eslint-env jest */
import { dereferenceOpenAPI } from './dereferenceOpenAPI'
import { OpenAPI, Schema } from './types'

describe('dereferenceOpenAPI()', () => {
  test('dereferenced object is a copy', () => {
    const document: OpenAPI = {
      openapi: '3.1.0',
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
      openapi: '3.1.0',
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
      openapi: '3.1.0',
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
      openapi: '3.1.0',
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
      (dereferencedDocument.components.schemas.Reference as Exclude<Schema, boolean>).allOf[0]
    )
  })

  test('recursive references are dereferenced', () => {
    const document: OpenAPI = {
      openapi: '3.1.0',
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
      (dereferencedDocument.components.schemas.Object as Exclude<Schema, boolean>).properties.recursive
    )
  })
})
