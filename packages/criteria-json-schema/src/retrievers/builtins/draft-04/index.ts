import { splitFragment } from '../../../util/uri'
import schemaJSON from './schema.json'

const schemas = [schemaJSON]

export const schemasByID = Object.fromEntries(
  schemas.map((schema) => {
    const { absoluteURI } = splitFragment(schema.id)
    return [absoluteURI, schema]
  })
)
