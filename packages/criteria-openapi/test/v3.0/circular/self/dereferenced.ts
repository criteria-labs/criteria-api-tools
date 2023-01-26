export default {
  openapi: '3.0.3',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {},
  components: {
    schemas: {
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
      },
      thing: {},
      child: {
        type: 'object',
        properties: {
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
          },
          name: {
            type: 'string'
          }
        },
        title: 'child'
      }
    }
  }
}
