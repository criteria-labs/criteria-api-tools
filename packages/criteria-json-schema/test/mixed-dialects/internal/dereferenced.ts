const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/person.json',
  type: 'object',
  title: 'person',
  properties: {
    oldRelative: null,
    newRelative: null
  },
  $defs: {
    '04-person': {
      $schema: 'http://json-schema.org/draft-04/schema#',
      $id: 'https://example.com/04-person.json',
      type: 'object',
      title: 'person',
      properties: {
        first: null,
        last: null
      },
      definitions: {
        requiredString: {
          id: '#requiredString',
          title: 'requiredString',
          type: 'string',
          minLength: 1
        }
      }
    },
    'similar-person': {
      $id: 'https://example.com/similar-person.json',
      type: 'object',
      title: 'person',
      properties: {
        first: null,
        last: null
      },
      $defs: {
        requiredString: {
          $anchor: 'requiredString',
          title: 'requiredString',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

schema.properties.oldRelative = schema.$defs['04-person']
schema.properties.newRelative = schema.$defs['similar-person']

schema.properties.oldRelative.properties.first = schema.properties.oldRelative.definitions.requiredString
schema.properties.oldRelative.properties.last = schema.properties.oldRelative.definitions.requiredString

schema.properties.newRelative.properties.first = schema.properties.newRelative.$defs.requiredString
schema.properties.newRelative.properties.last = schema.properties.newRelative.$defs.requiredString

export default schema
