import { metaSchemaIDDraft04, metaSchemaIDDraft06, metaSchemaIDDraft07 } from '@criteria/json-schema'

/// If the URI is missing a trailing slash, returns it with the slash
export function normalizedMetaSchemaID(uri: string): string {
  if (uri === metaSchemaIDDraft04.slice(0, -1)) {
    return metaSchemaIDDraft04
  }
  if (uri === metaSchemaIDDraft06.slice(0, -1)) {
    return metaSchemaIDDraft06
  }
  if (uri === metaSchemaIDDraft07.slice(0, -1)) {
    return metaSchemaIDDraft07
  }
  return uri
}
