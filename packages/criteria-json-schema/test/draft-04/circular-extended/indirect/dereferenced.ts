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

schema.definitions.pet = pet

schema.definitions.child.properties.pet.properties = pet.properties

schema.definitions.parent.properties.children.items.properties = schema.definitions.child.properties
schema.definitions.child.properties.parents.items.properties = schema.definitions.parent.properties

export default schema
