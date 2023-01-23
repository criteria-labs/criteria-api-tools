const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/person.json',
  type: 'object',
  title: 'person',
  properties: {
    oldRelative: {
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
    newRelative: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/2020-12-person.json',
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

schema.properties.oldRelative.properties.first = schema.properties.oldRelative.definitions.requiredString
schema.properties.oldRelative.properties.last = schema.properties.oldRelative.definitions.requiredString

schema.properties.newRelative.properties.first = schema.properties.newRelative.$defs.requiredString
schema.properties.newRelative.properties.last = schema.properties.newRelative.$defs.requiredString

export default schema
