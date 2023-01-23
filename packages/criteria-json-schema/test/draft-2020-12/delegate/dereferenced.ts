export default {
  title: 'Record',
  type: 'object',
  required: ['identifier'],
  properties: {
    identifier: {
      $ref: {
        type: 'string',
        pattern: '^[a-zA-Z0-9]*$'
      },
      pattern: '^[a-zA-Z]'
    }
  },
  definitions: {
    alphanumericWithInitialLetter: {
      $ref: {
        type: 'string',
        pattern: '^[a-zA-Z0-9]*$'
      },
      pattern: '^[a-zA-Z]'
    },
    alphanumeric: {
      type: 'string',
      pattern: '^[a-zA-Z0-9]*$'
    }
  }
}
