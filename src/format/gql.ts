import * as guard from '../util'
import { Validator, UnwrapBody } from '../types'

export function toGql<T extends Validator>(fn: string, params: object | null, type: T) {
  const func = toFunction(fn, params)

  return `{ ${func} ${toGqlReturn(type)} }`
}

export type GqlReturn<T extends Validator | null | [Validator]> = T extends Validator
  ? UnwrapBody<T>
  : T extends [Validator]
  ? UnwrapBody<T[0]>[]
  : null

function toFunction(fn: string, params: object | null) {
  if (!params) {
    return `${fn}`
  }

  const body = Object.entries(params)
    .map(([key, val]) => `${key}: ${parameterise(val)}`)
    .join(', ')
  return `${fn} (${body})`
}

const primitives = ['string', 'number', 'boolean']
function parameterise(value: any): string {
  if (primitives.includes(typeof value) || value === null) return JSON.stringify(value)
  if (value === undefined) return ''

  if (Array.isArray(value)) {
    const pairs = value.map((val) => {
      return parameterise(val)
    })
    return `[${pairs.join(', ')}]`
  }

  const obj = Array.from(Object.entries(value))
    .map(([key, val]) => `${key}: ${parameterise(val)}`)
    .join(', ')

  return `{ ${obj} }`
}

/**
 * Converts a 'Body' object to a GraphQL return value
 * for appending to graphQL mutation and queries
 *
 * A 'Body' is a shallow or deeply nested object that maps to a GraphQL type
 * These should be cheaper and easier to create than @GraphType/@GraphInput classes
 * and does not rely on inheritance, classes, and decorators
 */

function toGqlReturn<T extends Validator | [Validator]>(validator: T | null): string {
  if (validator === null) return ''
  const body = unwrapValidatorTuple(validator)
  const keys = Object.keys(body)

  const props = keys.map((key) => {
    const value = body[key]
    if (guard.isPrimitive(value) || guard.isOptionalPrimitive(value)) return key
    if (guard.isTuplePrimitive(value) || guard.isTupleOptional(value)) return key
    if (guard.isTupleBody(value)) return `${key} ${toGqlReturn(value[0])}`
    if (guard.isUnion(value)) return key
    return `${key} ${toGqlReturn(value)}`
  })

  return `{ ${props.join(' ')} }`
}

function unwrapValidatorTuple<T extends Validator | [Validator]>(validator: T): Validator {
  if (Array.isArray(validator)) {
    return validator[0]
  }

  return validator
}
