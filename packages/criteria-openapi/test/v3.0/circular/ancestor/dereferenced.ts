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
        title: 'person',
        properties: {
          spouse: null,
          pet: null,
          name: {
            type: 'string'
          },
          age: {
            type: 'number'
          }
        }
      },
      pet: {
        type: 'object',
        properties: {
          age: {
            type: 'number'
          },
          name: {
            type: 'string'
          },
          species: {
            enum: ['cat', 'dog', 'bird', 'fish'],
            type: 'string'
          }
        },
        title: 'pet'
      }
    }
  }
}

openAPI.components.schemas.person.properties.spouse = openAPI
openAPI.components.schemas.person.properties.pet = openAPI.components.schemas.pet

export default openAPI
