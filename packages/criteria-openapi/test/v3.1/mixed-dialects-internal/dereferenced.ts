const openAPI: any = {
  openapi: '3.0.3',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      person: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: 'https://example.com/person.json',
        type: 'object',
        title: 'person',
        properties: {
          oldRelative: null,
          newRelative: null
        },
        $defs: {
          '04-person': {
            $schema: 'http://json-schema.org/draft-04/schema#',
            $id: 'https://example.com/04-person.json',
            type: 'object',
            title: 'person',
            properties: {
              first: null,
              last: null
            },
            definitions: {
              requiredString: {
                id: '#requiredString',
                title: 'requiredString',
                type: 'string',
                minLength: 1
              }
            }
          },
          'similar-person': {
            $id: 'https://example.com/similar-person.json',
            type: 'object',
            title: 'person',
            properties: {
              first: null,
              last: null
            },
            $defs: {
              requiredString: {
                $anchor: 'requiredString',
                title: 'requiredString',
                type: 'string',
                minLength: 1
              }
            }
          }
        }
      }
    }
  }
}

openAPI.components.schemas.person.properties.oldRelative = openAPI.components.schemas.person.$defs['04-person']
openAPI.components.schemas.person.properties.newRelative = openAPI.components.schemas.person.$defs['similar-person']

openAPI.components.schemas.person.properties.oldRelative.properties.first =
  openAPI.components.schemas.person.properties.oldRelative.definitions.requiredString
openAPI.components.schemas.person.properties.oldRelative.properties.last =
  openAPI.components.schemas.person.properties.oldRelative.definitions.requiredString

openAPI.components.schemas.person.properties.newRelative.properties.first =
  openAPI.components.schemas.person.properties.newRelative.$defs.requiredString
openAPI.components.schemas.person.properties.newRelative.properties.last =
  openAPI.components.schemas.person.properties.newRelative.$defs.requiredString

export default openAPI
