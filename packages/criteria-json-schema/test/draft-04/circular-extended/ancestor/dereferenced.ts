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

const schema: any = {
  definitions: {
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

schema.definitions.pet = pet

schema.definitions.person.properties.pet.properties = schema.definitions.pet.properties
schema.definitions.person.properties.spouse.properties = schema.definitions.person.properties

export default schema
