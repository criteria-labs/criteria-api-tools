const schema: any = {
  definitions: {
    name: {
      required: ['first', 'last'],
      type: 'object',
      properties: {
        first: null,
        last: null,
        middle: {
          type: 'string',
          minLength: 1
        },
        prefix: {
          $ref: null,
          minLength: 3
        },
        suffix: {
          type: 'string',
          $ref: null,
          minLength: 3,
          maxLength: 3
        }
      }
    },
    phone: {
      type: 'object',
      description: 'Tests similar behavior to name, but with property declaration order reversed.',
      required: ['home', 'work'],
      properties: {
        home: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        work: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        mobile: {
          type: 'string',
          minLength: 1
        }
      }
    },
    requiredString: {
      title: 'requiredString',
      minLength: 1,
      type: 'string'
    },
    fragment: {
      $id: '#fragment'
    }
  },
  required: ['name'],
  type: 'object',
  properties: {
    name: null,
    phone: null,
    age: {
      minimum: 0,
      type: 'integer'
    },
    gender: {
      enum: ['male', 'female'],
      type: 'string'
    },
    fragment: null
  },
  title: 'Person'
}

schema.definitions.name.properties.first = schema.definitions.requiredString
schema.definitions.name.properties.last = schema.definitions.requiredString
schema.definitions.name.properties.prefix.$ref = schema.definitions.requiredString
schema.definitions.name.properties.suffix.$ref = schema.definitions.requiredString

schema.properties.name = schema.definitions.name
schema.properties.phone = schema.definitions.phone
schema.properties.fragment = schema.definitions.fragment

export default schema
