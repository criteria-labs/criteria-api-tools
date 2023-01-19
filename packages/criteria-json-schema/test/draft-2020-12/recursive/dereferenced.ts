const schema: any = {
  definitions: {
    alice: {
      $anchor: 'alice',
      allOf: []
    },
    bob: {
      $anchor: 'bob',
      allOf: []
    }
  }
}

schema.definitions.alice.allOf.push(schema.definitions.bob)
schema.definitions.bob.allOf.push(schema.definitions.alice)

export default schema
