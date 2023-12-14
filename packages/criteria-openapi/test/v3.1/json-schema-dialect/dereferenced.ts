const openAPI: any = {
  openapi: '3.1.0',
  jsonSchemaDialect: 'http://json-schema.org/draft-04/schema#',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      pet: {
        id: 'https://example.com/pet',
        $comment: 'This schema should be interpreted according to Draft 04.',
        properties: {
          name: null
        },
        definitions: {
          string: { id: '#string' }
        }
      },
      person: {
        $id: 'https://example.com/person',
        $comment:
          'This schema should be interpreted according to Draft 2020-12, despite the default for the OpenAPI document being Draft 04.',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        properties: {
          name: null
        },
        $defs: {
          string: { $anchor: 'string' }
        }
      }
    }
  }
}

openAPI.components.schemas.pet.properties.name = openAPI.components.schemas.pet.definitions.string
openAPI.components.schemas.person.properties.name = openAPI.components.schemas.person.$defs.string

export default openAPI
