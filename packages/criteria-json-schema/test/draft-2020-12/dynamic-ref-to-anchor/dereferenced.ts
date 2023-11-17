const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/dynamicRef-anchor-same-schema',

  $defs: {
    foo: {
      $anchor: 'items',
      type: 'string'
    }
  },
  type: 'array',
  items: null
}

schema.items = schema.$defs.foo

export default schema
