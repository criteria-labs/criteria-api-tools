/* eslint-env jest */
import {
  DereferencedJSONSchemaDraft2020_12,
  JSONSchemaDraft2020_12,
  dereferenceJSONSchemaDraft2020_12
} from '@criteria/json-schema'
import fs from 'fs'
import path from 'path'
import { jsonValidatorDraft2020_12 } from '../../src'

const testCasesDirectory = path.resolve(__dirname, '../__fixtures__/json-schema-test-suite/tests/draft2020-12')
const testFiles = fs.readdirSync(testCasesDirectory).filter((filename) => filename.endsWith('.json'))
let testFilesTable: [string][] = testFiles.map((testFile) => [testFile])

const remotesDirectoryPath = path.resolve(__dirname, '../__fixtures__/json-schema-test-suite/remotes')

const retrieveRemote = (uri: string): JSONSchemaDraft2020_12 => {
  if (uri.startsWith('http://localhost:1234/')) {
    const remotePath = uri.replace('http://localhost:1234', remotesDirectoryPath)
    const remoteContents = fs.readFileSync(remotePath, { encoding: 'utf-8' })
    const remote = JSON.parse(remoteContents)
    return remote
  } else {
    throw new Error(`Cannot retrieve remote at ${uri}`)
  }
}

// skip dynamicRef tests
testFilesTable = testFilesTable.filter((testFile) => testFile[0] !== 'dynamicRef.json')

describe.each(testFilesTable)(`tests/draft2020-12/%s`, (testFilename) => {
  const testFilePath = path.resolve(testCasesDirectory, testFilename)
  const testFileContents = fs.readFileSync(testFilePath, { encoding: 'utf-8' })
  const testCases = JSON.parse(testFileContents)
  let testCasesTable: [string, any, any[]][] = testCases.map((testCase) => [
    testCase.description,
    testCase.schema,
    testCase.tests
  ])

  describe.each(testCasesTable)('%s', (testCaseDescription, testCaseSchema, testCaseTests) => {
    let dereferencedSchema: DereferencedJSONSchemaDraft2020_12
    let testCaseSchemaValidator

    beforeAll(() => {
      expect(() => {
        dereferencedSchema = dereferenceJSONSchemaDraft2020_12(testCaseSchema, {
          referenceMergePolicy: 'none',
          retrieve: retrieveRemote
        }) as any

        testCaseSchemaValidator = jsonValidatorDraft2020_12(dereferencedSchema, {
          failFast: false,
          retrieve: retrieveRemote
        })
      }).not.toThrow()
    })

    const testsTable: [string, any, boolean][] = testCaseTests.map((test) => [test.description, test.data, test.valid])
    describe.each(testsTable)('%s', (testDescription, testData, testValid) => {
      if (testValid) {
        test('validateJSON() succeeds', () => {
          expect(() => {
            testCaseSchemaValidator(testData)
          }).not.toThrow()
        })
      } else {
        test('validateJSON() throws', () => {
          expect(() => {
            testCaseSchemaValidator(testData)
          }).toThrow()
        })
      }
    })
  })
})
