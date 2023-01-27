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
      parent: {
        title: 'parent',
        properties: {
          name: {
            type: 'string'
          },
          children: {
            items: {
              title: 'child',
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "child".\n',
              properties: null
            },
            type: 'array'
          }
        }
      },
      child: {
        title: 'child',
        properties: {
          parents: {
            items: {
              title: 'parent',
              description:
                'This JSON Reference has additional properties (other than $ref). This creates a new type that extends "parent".\n',
              properties: null
            },
            type: 'array'
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

openAPI.components.schemas.child.properties.pet.properties = pet.properties

openAPI.components.schemas.parent.properties.children.items.properties = openAPI.components.schemas.child.properties
openAPI.components.schemas.child.properties.parents.items.properties = openAPI.components.schemas.parent.properties

export default openAPI
