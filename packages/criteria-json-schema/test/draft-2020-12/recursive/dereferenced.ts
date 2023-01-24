const schema: any = {
  $defs: {
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

schema.$defs.alice.allOf.push(schema.$defs.bob)
schema.$defs.bob.allOf.push(schema.$defs.alice)

export default schema
