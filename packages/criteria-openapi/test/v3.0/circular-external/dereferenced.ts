const openAPI: any = {
  openapi: '3.0.3',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
      pet: {
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
            enum: ['cat', 'dog', 'bird', 'fish'],
            type: 'string'
          }
        }
      },
      thing: {},
      person: {
        title: 'person',
        type: 'object',
        properties: {
          spouse: null,
          name: {
            type: 'string'
          }
        }
      },
      parent: {
        title: 'parent',
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          children: {
            items: null,
            type: 'array'
          }
        }
      },
      child: {
        title: 'child',
        type: 'object',
        properties: {
          parents: {
            items: null,
            type: 'array'
          },
          name: {
            type: 'string'
          }
        }
      }
    }
  }
}

openAPI.components.schemas.person.properties.spouse = openAPI.components.schemas.person
openAPI.components.schemas.parent.properties.children.items = openAPI.components.schemas.child
openAPI.components.schemas.child.properties.parents.items = openAPI.components.schemas.parent

export default openAPI
