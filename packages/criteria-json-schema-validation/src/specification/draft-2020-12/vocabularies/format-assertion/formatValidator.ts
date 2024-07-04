import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { toASCII } from 'punycode'
import { parse as parseSMTPAddress } from 'smtp-address-parser'
import { parse as parseURI } from 'toad-uri-js'
import { format as formatInstance } from '../../../../util/format'
import { FlagOutput, VerboseOutput } from '../../../../validation/Output'
import { ValidatorContext } from '../../../../validation/keywordValidators'

const DATE_TIME_SEPARATOR = /t|\s/i
const isDateTime = (instance: string) => {
  const parts: string[] = instance.split(DATE_TIME_SEPARATOR)
  return parts.length === 2 && isDate(parts[0]) && isTime(parts[1])
}

const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const isLeapYear = (year: number): boolean => {
  // https://tools.ietf.org/html/rfc3339#appendix-C
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
const isDate = (instance: string) => {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  const matches: string[] | null = DATE.exec(instance)
  if (!matches) return false
  const year: number = +matches[1]
  const month: number = +matches[2]
  const day: number = +matches[3]
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month])
}

const TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i
const strictTimeZone = true
const isTime = (instance: string) => {
  const matches: string[] | null = TIME.exec(instance)
  if (!matches) return false
  const hr: number = +matches[1]
  const min: number = +matches[2]
  const sec: number = +matches[3]
  const tz: string | undefined = matches[4]
  const tzSign: number = matches[5] === '-' ? -1 : 1
  const tzH: number = +(matches[6] || 0)
  const tzM: number = +(matches[7] || 0)
  if (tzH > 23 || tzM > 59 || (strictTimeZone && !tz)) return false
  if (hr <= 23 && min <= 59 && sec < 60) return true
  // leap second
  const utcMin = min - tzM * tzSign
  const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0)
  return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61
}

const DURATION = /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/
const isDuration = (instance: string) => {
  return DURATION.test(instance)
}

const EMAIL = /^([^@]+|"[^"]+")@([^@]+)$/i
const isEmail = (instance: string) => {
  const matches: string[] | null = EMAIL.exec(instance)
  if (!matches) return false
  const localPart = matches[1]
  const hostname = matches[2]
  return isEmailLocalPart(localPart) && isEmailHostname(hostname)
}

const EMAIL_LOCAL_PART = /^("(?:[ !#-\[\]-~]|\\[\t -~])*"|[!#-'*+\-/-9=?A-Z\^-~]+(?:\.[!#-'*+\-/-9=?A-Z\^-~]+)*)$/i
const isEmailLocalPart = (instance: string) => {
  return EMAIL_LOCAL_PART.test(instance)
}

const EMAIL_HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i
const isEmailHostname = (instance: string) => {
  if (instance.startsWith('[IPv6:') && instance.endsWith(']')) {
    const ip = instance.slice(6, -1)
    return isIPv6(ip)
  } else if (instance.startsWith('[') && instance.endsWith(']')) {
    const ip = instance.slice(1, -1)
    return isIPv4(ip)
  } else {
    return EMAIL_HOSTNAME.test(instance)
  }
}

const HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i
const isHostname = (instance: string) => {
  return HOSTNAME.test(instance)
}

const isIDNEmail = (instance: string) => {
  try {
    parseSMTPAddress(instance)
    return true
  } catch {
    return false
  }
}

// https://json-schema.org/draft/2020-12/json-schema-validation#RFC5890
const isIDNHostname = (instance: string) => {
  const ascii = toASCII(instance)
  return ascii.replace(/\.$/, '').length <= 253 && HOSTNAME.test(ascii)
}

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const isIPv4 = (instance: string) => {
  return IPV4.test(instance)
}

const IPV6 =
  /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i
const isIPv6 = (instance: string) => {
  return IPV6.test(instance)
}

const IRI_FRAGMENT =
  /^([a-zA-Z0-9-._~!$&'()*+,;=:@/?]|%[0-9a-fA-F]{2}|[\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E0000}-\u{EFFFD}])*$/u
const IRI_PATH =
  /^([a-zA-Z0-9-._~!$&'()*+,;=:@/]|%[0-9a-fA-F]{2}|[\xA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E0000}-\u{EFFFD}])*$/u
const isIRIReference = (instance: string) => {
  const iri = parseURI(instance)
  if (iri.path && !IRI_PATH.test(decodeURIComponent(iri.path))) {
    return false
  }

  // All valid IRIs are valid IRI-references
  if (iri.scheme === 'mailto') {
    return (iri as any).to.every(parseSMTPAddress)
  }

  if (iri.reference === 'absolute' && iri.path !== undefined) {
    return true
  }

  // Check for valid IRI-reference

  // Check there's a path and for a proper type of reference
  return (
    iri.path !== undefined &&
    (iri.reference === 'relative' || iri.reference === 'same-document' || iri.reference === 'uri') &&
    (iri.fragment !== undefined ? IRI_FRAGMENT.test(decodeURIComponent(iri.fragment)) : true)
  )
}

const isIRI = (instance: string) => {
  const iri = parseURI(instance)
  if (iri.path !== undefined) {
    if (iri.host !== undefined) {
      if (iri.path !== '' && !iri.path.startsWith('/')) {
        return false
      }
    } else {
      if (iri.path.startsWith('//')) {
        return false
      }
    }
  }
  if (iri.scheme === 'mailto') {
    return (iri as any).to.every(parseSMTPAddress)
  }
  if (iri.reference === 'absolute' || iri.reference === 'uri') {
    return true
  }
  return false
}

const JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/
const isJSONPointer = (instance: string) => {
  return JSON_POINTER.test(instance)
}

const Z_ANCHOR = /[^\\]\\Z/
const isRegex = (instance: string) => {
  if (Z_ANCHOR.test(instance)) return false
  try {
    new RegExp(instance)
    return true
  } catch {
    return false
  }
}

const RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/
const isRelativeJSONPointer = (instance: string) => {
  return RELATIVE_JSON_POINTER.test(instance)
}

const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
const isUUID = (instance: string) => {
  return UUID.test(instance)
}

const URI_REFERENCE =
  /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i
const isURIReference = (instance: string) => {
  return URI_REFERENCE.test(instance)
}

const URI_TEMPLATE =
  /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i
const isURITemplate = (instance: string) => {
  return URI_TEMPLATE.test(instance)
}

const NOT_URI_FRAGMENT = /\/|:/
const URI =
  /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i

const isURI = (instance: string) => {
  // http://jmrware.com/articles/2009/uri_regexp/URI_regex.html + optional protocol + required "."
  return NOT_URI_FRAGMENT.test(instance) && URI.test(instance)
}

const formatPredicate = (format: string): ((instance: unknown) => boolean) => {
  switch (format) {
    case 'date-time':
      return isDateTime
    case 'date':
      return isDate
    case 'duration':
      return isDuration
    case 'email':
      return isEmail
    case 'hostname':
      return isHostname
    case 'idn-email':
      return isIDNEmail
    case 'idn-hostname':
      return isIDNHostname
    case 'ipv4':
      return isIPv4
    case 'ipv6':
      return isIPv6
    case 'iri-reference':
      return isIRIReference
    case 'iri':
      return isIRI
    case 'json-pointer':
      return isJSONPointer
    case 'regex':
      return isRegex
    case 'relative-json-pointer':
      return isRelativeJSONPointer
    case 'time':
      return isTime
    case 'unknown':
      return (instance: unknown) => true
    case 'uri-reference':
      return isURIReference
    case 'uri-template':
      return isURITemplate
    case 'uri':
      return isURI
    case 'uuid':
      return (instance: unknown) => typeof instance === 'string' && isUUID(instance)
    default:
      return (instance: unknown) => true
  }
}

export function formatValidator(schema: JSONSchemaObject, schemaPath: JSONPointer[], context: ValidatorContext) {
  if (!('format' in schema)) {
    return null
  }

  const format = schema['format']
  const predicate = formatPredicate(format)

  const outputFormat = context.outputFormat
  const schemaLocation = schemaPath.join('') as JSONPointer
  return (
    instance: any,
    instanceLocation: JSONPointer,
    annotationResults: Record<string, any>
  ): FlagOutput | VerboseOutput => {
    if (typeof instance !== 'string') {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (predicate(instance)) {
      return {
        valid: true,
        schemaLocation,
        schemaKeyword: 'format',
        instanceLocation
      }
    } else {
      if (outputFormat === 'flag') {
        return { valid: false }
      } else {
        return {
          valid: false,
          schemaLocation,
          schemaKeyword: 'format',
          instanceLocation,
          message: `should be formatted as ${format} but is ${formatInstance(instance)} instead`
        }
      }
    }
  }
}
