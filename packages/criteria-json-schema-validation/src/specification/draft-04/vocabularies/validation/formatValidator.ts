import type { JSONPointer } from '@criteria/json-pointer'
import { JSONSchemaObject } from '@criteria/json-schema/draft-2020-12'
import { format as formatInstance } from '../../../../util/format'
import { Output } from '../../../../validation/Output'
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

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const isIPv4 = (instance: string) => {
  return IPV4.test(instance)
}

const IPV6 =
  /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i
const isIPv6 = (instance: string) => {
  return IPV6.test(instance)
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
    case 'email':
      return isEmail
    case 'hostname':
      return isHostname
    case 'ipv4':
      return isIPv4
    case 'ipv6':
      return isIPv6
    case 'uri':
      return isURI
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
  return (instance: any, instanceLocation: JSONPointer, annotationResults: Record<string, any>): Output => {
    if (typeof instance !== 'string') {
      return { valid: true, schemaLocation, instanceLocation }
    }

    if (predicate(instance)) {
      return { valid: true, schemaLocation, schemaKeyword: 'multipleOf', instanceLocation }
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
