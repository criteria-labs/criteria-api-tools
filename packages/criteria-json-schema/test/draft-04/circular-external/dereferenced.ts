const schema: any = {
  definitions: {
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

schema.definitions.person.properties.spouse = schema.definitions.person
schema.definitions.parent.properties.children.items = schema.definitions.child
schema.definitions.child.properties.parents.items = schema.definitions.parent

export default schema
