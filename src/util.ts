import { OptionalPrimitive, Primitive, Validator } from './types'

export function isPrimitive(value: any): value is Primitive {
  return (
    typeof value === 'string' && (value === 'string' || value === 'boolean' || value === 'number')
  )
}

export function isOptionalPrimitive(value: any): value is OptionalPrimitive {
  return value === 'string?' || value === 'boolean?' || value === 'number?'
}

export function isTuplePrimitive(value: any): value is [Primitive] {
  if (Array.isArray(value) === false) return false
  if (value.length !== 1) return false
  if (!isPrimitive(value[0])) return false
  return true
}

export function isTupleOptional(value: any): value is [OptionalPrimitive] {
  if (Array.isArray(value) === false) return false
  if (value.length !== 1) return false
  if (!isOptionalPrimitive(value[0])) return false
  return true
}

export function isTupleBody(value: any): value is [Validator] | readonly [Validator] {
  if (Array.isArray(value) === false) return false
  if (value.length !== 1) return false
  return typeof value[0] === 'object'
}

export function isUnion<T extends string>(value: any): value is [T] | string[] | readonly string[] {
  if (Array.isArray(value) === false) return false
  if (value.length < 1) return false
  if (isPrimitive(value[0])) return false

  return true
}
