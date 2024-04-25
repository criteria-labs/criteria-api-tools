/* eslint-env jest */
import { resolve } from 'path'
import { dereferenceOpenAPI } from '../../../src/v3.0'
import retrieveFromFilesystem from '../../util/retrieveFromFilesystem'
import openAPI from './openapi.json'

describe('GitHub OpenAPI', () => {
  describe('dereferenceOpenAPI()', () => {
    describe('synchronous', () => {
      test('does not result in Maximum call stack size exceeded', () => {
        const output = dereferenceOpenAPI(openAPI as any, {
          baseURI: resolve(__dirname, 'openapi.json'),
          retrieve: retrieveFromFilesystem
        }) as any
        expect(output).toMatchObject({ openapi: '3.0.3' })
      })
    })
    describe('asynchronous', () => {
      test('does not result in Maximum call stack size exceeded', async () => {
        const output = (await dereferenceOpenAPI(openAPI as any, {
          baseURI: resolve(__dirname, 'openapi.json'),
          retrieve: async (uri) => await retrieveFromFilesystem(uri)
        })) as any
        expect(output).toMatchObject({ openapi: '3.0.3' })
      })
    })
  })
})
