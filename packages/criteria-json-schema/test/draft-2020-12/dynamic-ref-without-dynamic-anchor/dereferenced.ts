const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/dynamicRef-without-dynamicAnchor',

  $defs: {
    foo: {
      $dynamicAnchor: 'items',
      type: 'string'
    },
    list: {
      $id: 'list',
      type: 'array',
      items: null,
      $defs: {
        items: {
          $comment: 'This is only needed to give the reference somewhere to resolve to when it behaves like $ref',
          $anchor: 'items'
        }
      }
    }
  },
  $ref: null
}

schema.$ref = schema.$defs.list
schema.$defs.list.items = schema.$defs.list.$defs.items

export default schema
