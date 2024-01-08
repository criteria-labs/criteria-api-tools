import { ValidationError } from './errors/ValidationError'
import {
  isJSONValid,
  isJSONValidAsync,
  jsonValidator,
  jsonValidatorAsync,
  validateJSON,
  validateJSONAsync
} from './validation/jsonValidator'

export { isJSONValid, isJSONValidAsync, jsonValidator, jsonValidatorAsync, validateJSON, validateJSONAsync }

export {
  isJSONValidAsync as isJSONValidAsyncDraft04,
  isJSONValid as isJSONValidDraft04,
  jsonValidatorAsync as jsonValidatorAsyncDraft04,
  jsonValidator as jsonValidatorDraft04,
  validateJSONAsync as validateJSONAsyncDraft04,
  validateJSON as validateJSONDraft04
} from './specification/draft-04'
export {
  isJSONValidAsync as isJSONValidAsyncDraft06,
  isJSONValid as isJSONValidDraft06,
  jsonValidatorAsync as jsonValidatorAsyncDraft06,
  jsonValidator as jsonValidatorDraft06,
  validateJSONAsync as validateJSONAsyncDraft06,
  validateJSON as validateJSONDraft06
} from './specification/draft-06'
export {
  isJSONValidAsync as isJSONValidAsyncDraft2020_12,
  isJSONValid as isJSONValidDraft2020_12,
  jsonValidatorAsync as jsonValidatorAsyncDraft2020_12,
  jsonValidator as jsonValidatorDraft2020_12,
  validateJSONAsync as validateJSONAsyncDraft2020_12,
  validateJSON as validateJSONDraft2020_12
} from './specification/draft-2020-12'
export { OutputFormat } from './validation/Output'
export { ValidationError }
