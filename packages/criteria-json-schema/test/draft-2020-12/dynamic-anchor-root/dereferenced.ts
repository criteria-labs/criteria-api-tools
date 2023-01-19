const schema: any = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.com/strict-tree.json',
  $dynamicAnchor: 'node',

  type: 'object',
  properties: {
    data: true,
    children: {
      type: 'array',
      items: null
    }
  },
  unevaluatedProperties: false
}

schema.properties.children.items = schema

export default schema
