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

schema.definitions.pet = pet

schema.definitions.child.properties.pet.properties = pet.properties

schema.definitions.parent.properties.child.properties = schema.definitions.child.properties
schema.definitions.child.properties.children.items.properties = schema.definitions.child.properties

export default schema
