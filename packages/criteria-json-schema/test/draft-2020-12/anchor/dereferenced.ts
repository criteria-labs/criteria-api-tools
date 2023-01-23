export default {
  id: 'http://example.net/root.json',
  items: {
    type: 'array',
    items: {
      $anchor: 'item', // this is no longer valid when dereferenced, or should it transform to http://example.net/intermediate.json?
      type: 'integer'
    }
  },
  $defs: {
    inner: {
      $id: 'inner.json',
      items: {
        $anchor: 'item',
        type: 'integer'
      }
    }
  }
}
