import { retrieveUsingLookup } from './retrieveUsingLookup'
import { schemasByID } from './builtins/draft-2020-12'

export const retrieveBuiltin = retrieveUsingLookup(schemasByID)
