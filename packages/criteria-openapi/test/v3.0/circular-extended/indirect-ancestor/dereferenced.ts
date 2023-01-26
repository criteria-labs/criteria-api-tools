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
      pet: null,
      parent: {
        title: 'parent',
        properties: {
          name: {
            type: 'string'
          },
          child: {
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
            title: 'child',
            properties: null
          }
        }
      },
      child: {
        title: 'child',
        properties: {
          pet: {
            description:
              'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "pet".\n',
            title: 'pet',
            type: 'object',
            properties: null
          },
          name: {
            type: 'string'
          },
          children: {
            items: {
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
              title: 'child',
              properties: null
            },
            type: 'array',
            description: 'children'
          }
        }
      }
    }
  }
}

openAPI.components.schemas.pet = pet

openAPI.components.schemas.child.properties.pet.properties = pet.properties

openAPI.components.schemas.parent.properties.child.properties = openAPI.components.schemas.child.properties
openAPI.components.schemas.child.properties.children.items.properties = openAPI.components.schemas.child.properties

export default openAPI
