import { schemasByID as schemasByIDDraft04 } from './builtins/draft-04'
import { schemasByID as schemasByIDDraft06 } from './builtins/draft-06'
import { schemasByID as schemasByIDDraft2020_12 } from './builtins/draft-2020-12'
import { retrieveUsingLookup } from './retrieveUsingLookup'

export const retrieveBuiltin = retrieveUsingLookup({
  ...schemasByIDDraft04,
  ...schemasByIDDraft06,
  ...schemasByIDDraft2020_12
})
