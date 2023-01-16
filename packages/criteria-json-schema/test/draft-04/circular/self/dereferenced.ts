export default {
  definitions: {
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
