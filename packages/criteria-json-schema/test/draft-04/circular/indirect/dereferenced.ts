const schema: any = {
  definitions: {
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

schema.definitions.parent.properties.children.items = schema.definitions.child
schema.definitions.child.properties.parents.items = schema.definitions.parent
schema.definitions.child.properties.pet = schema.definitions.pet

export default schema
