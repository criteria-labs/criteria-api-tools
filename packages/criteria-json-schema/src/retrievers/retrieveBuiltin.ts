import { schemasByID as schemasByIDDraft04 } from '../specification/draft-04/meta-schema'
import { schemasByID as schemasByIDDraft06 } from '../specification/draft-06/meta-schema'
import { schemasByID as schemasByIDDraft07 } from '../specification/draft-07/meta-schema'
import { schemasByID as schemasByIDDraft2020_12 } from '../specification/draft-2020-12/meta-schema'
import { splitFragment } from '../util/uri'
import { retrieveUsingLookup } from './retrieveUsingLookup'

const schemasByID = {
  ...schemasByIDDraft04,
  ...schemasByIDDraft06,
  ...schemasByIDDraft07,
  ...schemasByIDDraft2020_12
}

export const retrieveBuiltin = retrieveUsingLookup(
  Object.fromEntries(
    Object.entries(schemasByID).map(([id, schema]) => {
      const { absoluteURI } = splitFragment(id)
      return [absoluteURI, schema]
    })
  )
)
