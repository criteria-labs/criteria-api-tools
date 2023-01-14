const schema: any = {
  definitions: {
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

schema.definitions.parent.properties.child = schema.definitions.child
schema.definitions.child.properties.children.items = schema.definitions.child
schema.definitions.child.properties.pet = schema.definitions.pet

export default schema
