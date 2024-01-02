/* eslint-env jest */
import { JSONSchemaDraft06 } from '@criteria/json-schema'
import fs from 'fs'
import path from 'path'
import { OutputFormat, jsonValidatorDraft06 } from '../../src'

const testCasesDirectory = path.resolve(__dirname, '../__fixtures__/json-schema-test-suite/tests/draft6')
const testFiles = fs.readdirSync(testCasesDirectory).filter((filename) => filename.endsWith('.json'))
let testFilesTable: [string][] = testFiles.map((testFile) => [testFile])

const remotesDirectoryPath = path.resolve(__dirname, '../__fixtures__/json-schema-test-suite/remotes')

const retrieveRemote = (uri: string): JSONSchemaDraft06 => {
  if (uri.startsWith('http://localhost:1234/')) {
    const remotePath = uri.replace('http://localhost:1234', remotesDirectoryPath)
    const remoteContents = fs.readFileSync(remotePath, { encoding: 'utf-8' })
    const remote = JSON.parse(remoteContents)
    return remote
  } else {
    throw new Error(`Cannot retrieve remote at ${uri}`)
  }
}

describe.each(testFilesTable)(`tests/draft6/%s`, (testFilename) => {
  const testFilePath = path.resolve(testCasesDirectory, testFilename)
  const testFileContents = fs.readFileSync(testFilePath, { encoding: 'utf-8' })
  const testCases = JSON.parse(testFileContents)
  let testCasesTable: [string, any, any[]][] = testCases.map((testCase) => [
    testCase.description,
    testCase.schema,
    testCase.tests
  ])

  describe.each(testCasesTable)('%s', (testCaseDescription, testCaseSchema, testCaseTests) => {
    describe.each([
      ['flag', true],
      ['flag', false],
      ['verbose', true],
      ['verbose', false]
    ])('outputFormat = %s, failFast = %s', (outputFormat, failFast) => {
      let testCaseSchemaValidator

      beforeAll(() => {
        expect(() => {
          testCaseSchemaValidator = jsonValidatorDraft06(testCaseSchema, {
            outputFormat: outputFormat as OutputFormat,
            failFast,
            retrieve: retrieveRemote
          })
        }).not.toThrow()
      })

      const testsTable: [string, any, boolean][] = testCaseTests.map((test) => [
        test.description,
        test.data,
        test.valid
      ])
      describe.each(testsTable)('%s', (testDescription, testData, testValid) => {
        if (testValid) {
          test('validateJSON() succeeds', () => {
            const { valid } = testCaseSchemaValidator(testData)
            expect(valid).toEqual(true)
          })
        } else {
          test('validateJSON() fails', () => {
            const { valid, message } = testCaseSchemaValidator(testData)
            expect(valid).toEqual(false)
            if (outputFormat === 'verbose') {
              expect(message).toMatchSnapshot()
            }
          })
        }
      })
    })
  })
})
