const schema: any = {
  $defs: {
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

schema.$defs.name.properties.first = schema.$defs.requiredString
schema.$defs.name.properties.last = schema.$defs.requiredString
schema.$defs.name.properties.prefix.$ref = schema.$defs.requiredString
schema.$defs.name.properties.suffix.$ref = schema.$defs.requiredString

schema.properties.name = schema.$defs.name
schema.properties.phone = schema.$defs.phone
schema.properties.fragment = schema.$defs.fragment

export default schema
