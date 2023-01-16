const schema: any = {
  definitions: {
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

schema.definitions.person.properties.spouse = schema
schema.definitions.person.properties.pet = schema.definitions.pet

export default schema
