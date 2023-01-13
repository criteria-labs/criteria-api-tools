import { JSONSchema } from '../../../src/draft-04'

const alice: JSONSchema = {
  id: '#alice'
}

const bob: JSONSchema = {
  id: '#bob'
}

alice.allOf = [bob]
bob.allOf = [alice]

export default {
  definitions: {
    alice: alice,
    bob: bob
  }
}
