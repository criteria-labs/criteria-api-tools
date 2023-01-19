const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/string-array.json',

  $defs: {
    element: {
      $dynamicAnchor: 'element',
      type: 'string'
    }
  },
  type: 'array',
  items: null
}

schema.items = schema.$defs.element

export default schema
