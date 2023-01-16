import { readFileSync } from 'fs'

export default function retrieveFromFilesystem(uri: string) {
  const data = readFileSync(uri, { encoding: 'utf8' })
  return JSON.parse(data)
}
