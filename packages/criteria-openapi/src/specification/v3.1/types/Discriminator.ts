export interface Discriminator {
  propertyName: string
  mapping?: { [key: string]: string }

  [key: `x-${string}`]: any
}
