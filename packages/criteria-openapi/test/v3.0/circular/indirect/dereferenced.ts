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
            items: null,
            type: 'array'
          }
        }
      },
      child: {
        title: 'child',
        properties: {
          parents: {
            items: null,
            type: 'array'
          },
          pet: null,
          name: {
            type: 'string'
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

openAPI.components.schemas.parent.properties.children.items = openAPI.components.schemas.child
openAPI.components.schemas.child.properties.parents.items = openAPI.components.schemas.parent
openAPI.components.schemas.child.properties.pet = openAPI.components.schemas.pet

export default openAPI
