const schema: any = {
  definitions: {
    alice: {
      id: '#alice',
      allOf: []
    },
    bob: {
      id: '#bob',
      allOf: []
    }
  }
}

schema.definitions.alice.allOf.push(schema.definitions.bob)
schema.definitions.bob.allOf.push(schema.definitions.alice)

export default schema
