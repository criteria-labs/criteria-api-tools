import { metaSchemaURIDraft04, metaSchemaURIDraft06, metaSchemaURIDraft07 } from '@criteria/json-schema'

/// If the URI is missing a trailing slash, returns it with the slash

export function normalizedMetaSchemaURI(uri: string): string {
  if (uri === metaSchemaURIDraft04.slice(0, -1)) {
    return metaSchemaURIDraft04
  }
  if (uri === metaSchemaURIDraft06.slice(0, -1)) {
    return metaSchemaURIDraft06
  }
  if (uri === metaSchemaURIDraft07.slice(0, -1)) {
    return metaSchemaURIDraft07
  }
  return uri
}
