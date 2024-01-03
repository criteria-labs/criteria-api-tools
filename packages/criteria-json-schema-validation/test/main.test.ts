/* eslint-env jest */
import * as JSONSchemaValidation from '../src'

describe('Default entry points', () => {
  const schema = {
    type: 'object',
    title: 'person',
    required: ['name'],
    properties: {
      name: {
        type: 'string'
      }
    }
  }
  test('validateJSON', () => {
    expect(() => {
      JSONSchemaValidation.validateJSON({ name: 'Joan' }, schema)
    }).not.toThrow()
  })
  test('isJSONValid', () => {
    const valid = JSONSchemaValidation.isJSONValid({ name: 'Joan' }, schema)
    expect(valid).toBe(true)
  })
  test('jsonValidator', () => {
    const validator = JSONSchemaValidation.jsonValidator(schema)
    const { valid } = validator({ name: 'Joan' })
    expect(valid).toBe(true)
  })
})

describe('Dereferencing schemas', () => {
  const personSchema = {
    type: 'object',
    title: 'person',
    required: ['address'],
    properties: {
      address: {
        $ref: 'https://example.com/schemas/address.json'
      }
    }
  }
  const addressSchema = {
    type: 'object',
    title: 'address',
    required: ['street'],
    properties: {
      street: {
        type: 'string'
      }
    }
  }
  describe('synchronous retrieve function', () => {
    const retrieve = (uri: string): any => {
      if (uri === 'https://example.com/schemas/address.json') {
        return addressSchema
      }
      throw new Error(`Cannot retrieve document at '${uri}'`)
    }
    test('validateJSON', () => {
      expect(() => {
        JSONSchemaValidation.validateJSON({ address: { street: 'Example St' } }, personSchema, { retrieve })
      }).not.toThrow()
    })
    test('isJSONValid', () => {
      const valid = JSONSchemaValidation.isJSONValid({ address: { street: 'Example St' } }, personSchema, { retrieve })
      expect(valid).toBe(true)
    })
    test('jsonValidator', () => {
      const validator = JSONSchemaValidation.jsonValidator(personSchema, { retrieve })
      const { valid } = validator({ address: { street: 'Example St' } })
      expect(valid).toBe(true)
    })
  })
  describe('asynchronous retrieve function', () => {
    const retrieve = async (uri: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (uri === 'https://example.com/schemas/address.json') {
            resolve(addressSchema)
          } else {
            reject(new Error(`Cannot retrieve document at '${uri}'`))
          }
        }, 200)
      })
    }
    test('validateJSON', async () => {
      await expect(async () => {
        await JSONSchemaValidation.validateJSON({ address: { street: 'Example St' } }, personSchema, { retrieve })
      }).not.toThrow()
    })
    test('isJSONValid', async () => {
      const valid = await JSONSchemaValidation.isJSONValid({ address: { street: 'Example St' } }, personSchema, {
        retrieve
      })
      expect(valid).toBe(true)
    })
    test('jsonValidator', async () => {
      const validator = await JSONSchemaValidation.jsonValidator(personSchema, { retrieve })
      const { valid } = validator({ address: { street: 'Example St' } })
      expect(valid).toBe(true)
    })
  })
  describe('asynchronous retrieve function not called', () => {
    const retrieve = async (uri: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Cannot retrieve document at '${uri}'`))
        }, 200)
      })
    }
    test('validateJSON', async () => {
      await expect(async () => {
        await JSONSchemaValidation.validateJSON({ address: { street: 'Example St' } }, {}, { retrieve })
      }).not.toThrow()
    })
    test('isJSONValid', async () => {
      const valid = await JSONSchemaValidation.isJSONValid({ address: { street: 'Example St' } }, {}, { retrieve })
      expect(valid).toBe(true)
    })
    test('jsonValidator', async () => {
      const validator = await JSONSchemaValidation.jsonValidator({}, { retrieve })
      const { valid } = validator({ address: { street: 'Example St' } })
      expect(valid).toBe(true)
    })
  })
})
