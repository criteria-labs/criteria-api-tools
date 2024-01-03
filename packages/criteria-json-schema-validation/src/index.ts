import { ValidationError } from './errors/ValidationError'
import { isJSONValid, jsonValidator, validateJSON } from './validation/jsonValidator'

export { isJSONValid, jsonValidator, validateJSON }

export { jsonValidator as jsonValidatorDraft04, validateJSON as validateJSONDraft04 } from './specification/draft-04'
export { jsonValidator as jsonValidatorDraft06, validateJSON as validateJSONDraft06 } from './specification/draft-06'
export {
  jsonValidator as jsonValidatorDraft2020_12,
  validateJSON as validateJSONDraft2020_12
} from './specification/draft-2020-12'
export { OutputFormat } from './validation/Output'
export { ValidationError }
