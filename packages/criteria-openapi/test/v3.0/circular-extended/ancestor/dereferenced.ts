const pet = {
  title: 'pet',
  type: 'object',
  properties: {
    age: {
      type: 'number'
    },
    name: {
      type: 'string'
    },
    species: {
      type: 'string',
      enum: ['cat', 'dog', 'bird', 'fish']
    }
  }
}

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
          spouse: {
            title: 'person',
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "person".\n',
            properties: null
          },
          pet: {
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
            title: 'pet',
            type: 'object',
            properties: null
          },
          name: {
            type: 'string'
          }
        }
      },
      pet: null
    }
  }
}

openAPI.components.schemas.pet = pet

openAPI.components.schemas.person.properties.pet.properties = openAPI.components.schemas.pet.properties
openAPI.components.schemas.person.properties.spouse.properties = openAPI.components.schemas.person.properties

export default openAPI
