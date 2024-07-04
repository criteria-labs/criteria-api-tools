import { schemasByID as schemasByIDv3_1 } from '../specification/v3.1/json-schema'
import { splitFragment } from '../util/uri'
import { retrieveUsingLookup } from './retrieveUsingLookup'

const schemasByID = {
  ...schemasByIDv3_1
}

export const retrieveBuiltin = retrieveUsingLookup(
  Object.fromEntries(
    Object.entries(schemasByID).map(([id, schema]) => {
      const { absoluteURI } = splitFragment(id)
      return [absoluteURI, schema]
    })
  )
)
