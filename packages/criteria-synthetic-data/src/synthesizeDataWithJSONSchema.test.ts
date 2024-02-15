import { synthesizeDataWithJSONSchema } from '.'

describe('synthesizeDataWithJSONSchema()', () => {
  describe('with an object schema', () => {
    test('synthesizes an object', () => {
      const data = synthesizeDataWithJSONSchema({
        type: 'object',
        required: ['name', 'age', 'verified', 'labels'],
        properties: {
          name: {
            type: 'string'
          },
          age: {
            type: 'integer'
          },
          verified: {
            type: 'boolean'
          },
          labels: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      })
      expect(data).toEqual({
        name: 'string',
        age: 3,
        verified: false,
        labels: ['string', 'string']
      })
    })
  })
})
