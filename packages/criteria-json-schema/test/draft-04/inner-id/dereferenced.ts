export default {
  id: 'http://example.net/root.json',
  items: {
    type: 'array',
    items: {
      id: '#item', // this is no longer valid when dereferenced, or should it transform to http://example.net/intermediate.json?
      type: 'integer'
    }
  },
  definitions: {
    inner: {
      id: 'inner.json',
      items: {
        id: '#item',
        type: 'integer'
      }
    }
  }
}
