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
          child: null
        }
      },
      child: {
        title: 'child',
        properties: {
          name: {
            type: 'string'
          },
          pet: null,
          children: {
            items: null,
            type: 'array',
            description: 'children'
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

openAPI.components.schemas.parent.properties.child = openAPI.components.schemas.child
openAPI.components.schemas.child.properties.children.items = openAPI.components.schemas.child
openAPI.components.schemas.child.properties.pet = openAPI.components.schemas.pet

export default openAPI
