/* eslint-env jest */
import * as JSONSchemaValidation from '../src'
import { isPromise } from '../src/util/promises'
import { JSONValidator } from '../src/validation/jsonValidator'

// rejects

describe('validateJSON()', () => {
  describe('with self-contained schema', () => {
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
    const validInstance = { name: 'Joan' }
    const invalidInstance = {}
    describe('without retrieve', () => {
      test('valid instance does not throw', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(validInstance, schema)
        }).not.toThrow()
      })
      test('invalid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(invalidInstance, schema)
        }).toThrow()
      })
    })
    describe('with unused synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance does not throw', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
        }).not.toThrow()
      })
      test('invalid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })
        }).toThrow()
      })
    })
    describe('with unused asynchronous retrieve', () => {
      const retrieve = async (uri: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`Cannot retrieve document at '${uri}'`))
          }, 200)
        })
      }
      describe('promise API', () => {
        test('valid instance returns synchronously', () => {
          try {
            const promiseOrResult = JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
            expect(isPromise(promiseOrResult)).toBe(false)
            expect(promiseOrResult).toBeUndefined()
          } catch {
            // always fail
            expect(true).toBe(false)
          }
        })
        test('invalid instance throws synchronously', () => {
          try {
            const promiseOrResult = JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })
            expect(isPromise(promiseOrResult)).toBe(false)
          } catch (error) {
            expect(error).toHaveProperty('name', 'ValidationError')
          }
        })
        describe('with async variant', () => {
          test('valid instance resolves', () => {
            const promise = JSONSchemaValidation.validateJSONAsync(validInstance, schema, { retrieve })
            expect(isPromise(promise)).toBe(true)
            expect(promise).resolves
          })
          test('invalid instance rejects', () => {
            const promise = JSONSchemaValidation.validateJSONAsync(invalidInstance, schema, { retrieve })
            expect(isPromise(promise)).toBe(true)
            expect(promise).rejects.toHaveProperty('name', 'ValidationError')
          })
        })
      })
      describe('async/await API', () => {
        test('valid instance does not throw', async () => {
          try {
            await JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
            expect(true).toBe(true)
          } catch {
            // always fail
            expect(true).toBe(false)
          }
        })
        test('invalid instance throws', async () => {
          try {
            await JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })

            // always fail
            expect(true).toBe(false)
          } catch (error) {
            expect(error).toHaveProperty('name', 'ValidationError')
          }
        })
      })
    })
  })
  describe('with referenced schema', () => {
    const schema = {
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
      $id: 'https://example.com/schemas/address.json',
      type: 'object',
      title: 'address',
      required: ['street'],
      properties: {
        street: {
          type: 'string'
        }
      }
    }
    const validInstance = { address: { street: 'Example St' } }
    const invalidInstance = { address: {} }
    describe('without retrieve', () => {
      test('valid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(validInstance, schema)
        }).toThrow()
      })
      test('invalid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(invalidInstance, schema)
        }).toThrow()
      })
    })
    describe('with synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        if (uri === 'https://example.com/schemas/address.json') {
          return addressSchema
        }
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance does not throw', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
        }).not.toThrow()
      })
      test('invalid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })
        }).toThrow()
      })
    })
    describe('with asynchronous retrieve', () => {
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
      describe('promise API', () => {
        test('valid instance resolves', () => {
          const promise = JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
          expect(isPromise(promise)).toBe(true)
          expect(promise).resolves
        })
        test('invalid instance rejects', () => {
          const promise = JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })
          expect(isPromise(promise)).toBe(true)
          expect(promise).rejects.toHaveProperty('name', 'ValidationError')
        })
      })
      describe('async/await API', () => {
        test('valid instance does not throw', async () => {
          try {
            await JSONSchemaValidation.validateJSON(validInstance, schema, { retrieve })
          } catch {
            // always fail
            expect(true).toBe(false)
          }
        })
        test('invalid instance throws', async () => {
          try {
            await JSONSchemaValidation.validateJSON(invalidInstance, schema, { retrieve })

            // always fail
            expect(true).toBe(false)
          } catch (error) {
            expect(error).toHaveProperty('name', 'ValidationError')
          }
        })
      })
    })
  })
})

describe('isJSONValid()', () => {
  describe('with self-contained schema', () => {
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
    const validInstance = { name: 'Joan' }
    const invalidInstance = {}
    describe('without retrieve', () => {
      test('valid instance returns true', () => {
        const valid = JSONSchemaValidation.isJSONValid(validInstance, schema)
        expect(valid).toBe(true)
      })
      test('invalid instance returns false', () => {
        const valid = JSONSchemaValidation.isJSONValid(invalidInstance, schema)
        expect(valid).toBe(false)
      })
    })
    describe('with unused synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance returns true', () => {
        const valid = JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
        expect(valid).toBe(true)
      })
      test('invalid instance returns false', () => {
        const valid = JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
        expect(valid).toBe(false)
      })
    })
    describe('with unused asynchronous retrieve', () => {
      const retrieve = async (uri: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`Cannot retrieve document at '${uri}'`))
          }, 200)
        })
      }
      describe('promise API', () => {
        test('valid instance returns true synchronously', () => {
          const promiseOrResult = JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
          expect(isPromise(promiseOrResult)).toBe(false)
          expect(promiseOrResult).toBe(true)
        })
        test('invalid instance returns false synchronously', () => {
          const promiseOrResult = JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
          expect(isPromise(promiseOrResult)).toBe(false)
          expect(promiseOrResult).toBe(false)
        })
        describe('with async variant', () => {
          test('valid instance resolves to true', () => {
            const promise = JSONSchemaValidation.isJSONValidAsync(validInstance, schema, { retrieve })
            expect(isPromise(promise)).toBe(true)
            expect(promise).resolves.toBe(true)
          })
          test('invalid instance resolves to false', () => {
            const promise = JSONSchemaValidation.isJSONValidAsync(invalidInstance, schema, { retrieve })
            expect(isPromise(promise)).toBe(true)
            expect(promise).resolves.toBe(false)
          })
        })
      })
      describe('async/await API', () => {
        test('valid instance returns true', async () => {
          const valid = await JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
          expect(valid).toBe(true)
        })
        test('invalid instance returns false', async () => {
          const valid = await JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
          expect(valid).toBe(false)
        })
      })
    })
  })
  describe('with referenced schema', () => {
    const schema = {
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
      $id: 'https://example.com/schemas/address.json',
      type: 'object',
      title: 'address',
      required: ['street'],
      properties: {
        street: {
          type: 'string'
        }
      }
    }
    const validInstance = { address: { street: 'Example St' } }
    const invalidInstance = { address: {} }
    describe('without retrieve', () => {
      test('valid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.isJSONValid(validInstance, schema)
        }).toThrow()
      })
      test('invalid instance throws', () => {
        expect(() => {
          JSONSchemaValidation.isJSONValid(invalidInstance, schema)
        }).toThrow()
      })
    })
    describe('with synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        if (uri === 'https://example.com/schemas/address.json') {
          return addressSchema
        }
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance returns true', () => {
        const valid = JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
        expect(valid).toBe(true)
      })
      test('invalid instance returns false', () => {
        const valid = JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
        expect(valid).toBe(false)
      })
    })
    describe('with asynchronous retrieve', () => {
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
      describe('promise API', () => {
        test('valid instance resolves to true', () => {
          const promise = JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
          expect(isPromise(promise)).toBe(true)
          expect(promise).resolves.toBe(true)
        })
        test('invalid instance resolves to false', () => {
          const promise = JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
          expect(isPromise(promise)).toBe(true)
          expect(promise).resolves.toBe(false)
        })
      })
      describe('async/await API', () => {
        test('valid instance returns true', async () => {
          const valid = await JSONSchemaValidation.isJSONValid(validInstance, schema, { retrieve })
          expect(valid).toBe(true)
        })
        test('invalid instance returns false', async () => {
          const valid = await JSONSchemaValidation.isJSONValid(invalidInstance, schema, { retrieve })
          expect(valid).toBe(false)
        })
      })
    })
  })
})

describe('jsonValidator()', () => {
  describe('with self-contained schema', () => {
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
    const validInstance = { name: 'Joan' }
    const invalidInstance = {}
    describe('without retrieve', () => {
      test('valid instance returns valid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema)
        expect(typeof validator).toBe('function')

        const { valid } = validator(validInstance)
        expect(valid).toBe(true)
      })
      test('invalid instance returns invalid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema)
        expect(typeof validator).toBe('function')

        const { valid } = validator(invalidInstance)
        expect(valid).toBe(false)
      })
    })
    describe('with unused synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance returns valid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema, { retrieve })
        expect(typeof validator).toBe('function')

        const { valid } = validator(validInstance)
        expect(valid).toBe(true)
      })
      test('invalid instance returns invalid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema, { retrieve })
        expect(typeof validator).toBe('function')

        const { valid } = validator(invalidInstance)
        expect(valid).toBe(false)
      })
    })
    describe('with unused asynchronous retrieve', () => {
      const retrieve = async (uri: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error(`Cannot retrieve document at '${uri}'`))
          }, 200)
        })
      }
      describe('promise API', () => {
        test('valid instance returns valid output synchronously', () => {
          const promiseOrResult = JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(isPromise(promiseOrResult)).toBe(false)

          expect(typeof promiseOrResult).toBe('function')

          const { valid } = (promiseOrResult as JSONValidator)(validInstance)
          expect(valid).toBe(true)
        })
        test('invalid instance returns invalid output synchronously', () => {
          const promiseOrResult = JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(isPromise(promiseOrResult)).toBe(false)

          expect(typeof promiseOrResult).toBe('function')

          const { valid } = (promiseOrResult as JSONValidator)(invalidInstance)
          expect(valid).toBe(false)
        })
        describe('with async variant', () => {
          test('valid instance resolves to validator that returns valid output', () => {
            const promise = JSONSchemaValidation.jsonValidatorAsync(schema, { retrieve })
            expect(isPromise(promise)).toBe(true)

            return promise.then((validator) => {
              expect(typeof validator).toBe('function')

              const { valid } = validator(validInstance)
              expect(valid).toBe(true)
            })
          })
          test('invalid instance resolves to validator that returns invalid output', () => {
            const promise = JSONSchemaValidation.jsonValidatorAsync(schema, { retrieve })
            expect(isPromise(promise)).toBe(true)

            return promise.then((validator) => {
              expect(typeof validator).toBe('function')

              const { valid } = validator(invalidInstance)
              expect(valid).toBe(false)
            })
          })
        })
      })
      describe('async/await API', () => {
        test('valid instance returns valid output', async () => {
          const validator = await JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(typeof validator).toBe('function')

          const { valid } = validator(validInstance)
          expect(valid).toBe(true)
        })
        test('invalid instance returns invalid output', async () => {
          const validator = await JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(typeof validator).toBe('function')

          const { valid } = validator(invalidInstance)
          expect(valid).toBe(false)
        })
      })
    })
  })
  describe('with referenced schema', () => {
    const schema = {
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
      $id: 'https://example.com/schemas/address.json',
      type: 'object',
      title: 'address',
      required: ['street'],
      properties: {
        street: {
          type: 'string'
        }
      }
    }
    const validInstance = { address: { street: 'Example St' } }
    const invalidInstance = { address: {} }
    describe('without retrieve', () => {
      test('throws error', () => {
        expect(() => {
          JSONSchemaValidation.jsonValidator(schema)
        }).toThrow()
      })
    })
    describe('with synchronous retrieve', () => {
      const retrieve = (uri: string): any => {
        if (uri === 'https://example.com/schemas/address.json') {
          return addressSchema
        }
        throw new Error(`Cannot retrieve document at '${uri}'`)
      }
      test('valid instance returns valid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema, { retrieve })
        expect(typeof validator).toBe('function')

        const { valid } = validator(validInstance)
        expect(valid).toBe(true)
      })
      test('invalid instance returns invalid output', () => {
        const validator = JSONSchemaValidation.jsonValidator(schema, { retrieve })
        expect(typeof validator).toBe('function')

        const { valid } = validator(invalidInstance)
        expect(valid).toBe(false)
      })
    })
    describe('with asynchronous retrieve', () => {
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
      describe('promise API', () => {
        test('valid instance resolves to validator that returns valid output', () => {
          const promise = JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(isPromise(promise)).toBe(true)

          return (promise as Promise<JSONValidator>).then((validator) => {
            expect(typeof validator).toBe('function')

            const { valid } = validator(validInstance)
            expect(valid).toBe(true)
          })
        })
        test('invalid instance resolves to validator that returns invalid output', () => {
          const promise = JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(isPromise(promise)).toBe(true)

          return (promise as Promise<JSONValidator>).then((validator) => {
            expect(typeof validator).toBe('function')

            const { valid } = validator(invalidInstance)
            expect(valid).toBe(false)
          })
        })
      })
      describe('async/await API', () => {
        test('valid instance returns true', async () => {
          const validator = await JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(typeof validator).toBe('function')

          const { valid } = validator(validInstance)
          expect(valid).toBe(true)
        })
        test('invalid instance returns false', async () => {
          const validator = await JSONSchemaValidation.jsonValidator(schema, { retrieve })
          expect(typeof validator).toBe('function')

          const { valid } = validator(invalidInstance)
          expect(valid).toBe(false)
        })
      })
    })
  })
})
