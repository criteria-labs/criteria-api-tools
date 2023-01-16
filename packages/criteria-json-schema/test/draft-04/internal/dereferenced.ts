export default {
  definitions: {
    fragment: {
      id: '#fragment'
    },
    requiredString: {
      title: 'requiredString',
      minLength: 1,
      type: 'string'
    },
    name: {
      required: ['first', 'last'],
      type: 'object',
      properties: {
        first: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        last: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        middle: {
          type: 'string',
          minLength: 1
        },
        prefix: {
          title: 'requiredString',
          type: 'string',
          minLength: 3
        },
        suffix: {
          title: 'requiredString',
          type: 'string',
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
    }
  },
  required: ['name'],
  type: 'object',
  properties: {
    fragment: {
      id: '#fragment'
    },
    gender: {
      enum: ['male', 'female'],
      type: 'string'
    },
    age: {
      minimum: 0,
      type: 'integer'
    },
    name: {
      required: ['first', 'last'],
      type: 'object',
      properties: {
        first: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        last: {
          title: 'requiredString',
          type: 'string',
          minLength: 1
        },
        middle: {
          type: 'string',
          minLength: 1
        },
        prefix: {
          title: 'requiredString',
          type: 'string',
          minLength: 3
        },
        suffix: {
          title: 'requiredString',
          type: 'string',
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
    }
  },
  title: 'Person'
}
