type FromTupleLiteral<T> = T extends [...infer U] | readonly [...infer U]
  ? U extends Primitive
    ? never
    : T[number] extends string
    ? T[number]
    : never
  : never

type Primitive = 'string' | 'number' | 'boolean'
type Reference =
  | Primitive
  | readonly [Primitive]
  | [Primitive]
  | readonly [Validator]
  | [Validator]
  | Validator
  | [...string[]]
  | readonly [...string[]]

export type Validator = { [key: string]: Reference }

type FromPrimitve<T extends Primitive> = T extends 'string'
  ? string
  : T extends 'boolean'
  ? boolean
  : T extends 'number'
  ? number
  : never

type FromTuple<T> = T extends [infer U] | readonly [infer U]
  ? U extends Primitive
    ? Array<FromPrimitve<U>>
    : never
  : never

type FromTupleBody<T> = T extends [infer U]
  ? U extends Validator
    ? Array<UnwrapBody<U>>
    : never
  : T extends readonly [infer U]
  ? U extends Validator
    ? Array<UnwrapBody<U>>
    : never
  : never

export type UnwrapBody<T extends { [key: string]: Reference }> = {
  -readonly [key in keyof T]: T[key] extends Primitive
    ? FromPrimitve<T[key]>
    : T[key] extends [Primitive] | readonly [Primitive]
    ? FromTuple<T[key]>
    : T[key] extends [Validator] | readonly [Validator]
    ? FromTupleBody<T[key]>
    : T[key] extends Validator
    ? UnwrapBody<T[key]>
    : FromTupleLiteral<T[key]>
}

export function isValid<T extends Validator>(type: T, compare: any): compare is UnwrapBody<T> {
  const errors = validateBody(type, compare, { notThrow: true })
  return errors.length === 0
}

export function assertValid<T extends Validator>(
  type: T,
  compare: any,
  partial?: boolean
): asserts compare is UnwrapBody<T> {
  const errors = validateBody(type, compare, { notThrow: true, partial })
  if (errors.length) {
    throw new Error(`Request body is invalid: ${errors.join(', ')}`)
  }
}

export function isValidPartial<T extends Validator>(type: T, compare: any): compare is Partial<UnwrapBody<T>> {
  const errors = validateBody(type, compare, { notThrow: true, partial: true })
  return errors.length === 0
}

export function validateBody<T extends Validator>(
  type: T,
  compare: any,
  opts: { partial?: boolean; prefix?: string; notThrow?: boolean } = {}
) {
  const prefix = opts.prefix ? `${opts.prefix}.` : ''
  const errors: string[] = []

  start: for (const key in type) {
    const prop = `${prefix}${key}`
    const bodyType = type[key]
    let value
    try {
      value = compare[key]
    } catch (ex) {
      throw new Error(`${ex.message}: ${prop}`)
    }

    if (value === undefined) {
      if (!opts.partial) errors.push(`.${prop} is undefined`)
      continue
    }

    if (isPrimitive(bodyType) && typeof value !== bodyType) {
      errors.push(`.${prop} is ${typeof value}, expected ${bodyType}`)
      continue
    }

    if (isTuplePrimitive(bodyType)) {
      const [innerType] = bodyType
      if (!Array.isArray(value)) {
        errors.push(`.${prop} is ${typeof value}, expected Array<${innerType}>`)
        continue start
      }

      for (const tupleValue of value) {
        if (typeof tupleValue === innerType) continue

        // We will exit on the first mismatch
        // We could report all distinct erronous types?
        errors.push(`.${prop} element contains ${typeof tupleValue}, expected ${innerType}`)
        continue start
      }
    }

    if (isTupleBody(bodyType)) {
      if (!Array.isArray(value)) {
        errors.push(`.${prop} is ${typeof value}, expected Array`)
        continue start
      }

      const [innerBody] = bodyType
      for (const tupleValue of value) {
        if (typeof tupleValue !== 'object') {
          errors.push(`.${prop} element contains ${typeof tupleValue}, expected object`)
          continue start
        }

        const innerErrors = validateBody(innerBody, tupleValue, {
          prefix: prop,
          notThrow: true,
          partial: opts.partial,
        })
        if (!innerErrors.length) continue
        errors.push(...innerErrors)
        continue start
      }

      continue
    }

    if (isUnion(bodyType)) {
      if (typeof value !== 'string') {
        errors.push(`.${prop} is ${typeof value}, expected literal of ${bodyType.join(' | ')}`)
        continue start
      }

      if (bodyType.includes(value) === false) {
        errors.push(`.${prop} value is invalid, expected literal of ${bodyType.join(' | ')}`)
        continue start
      }

      continue
    }

    if (typeof bodyType === 'object') {
      if (typeof value !== 'object') {
        errors.push(`${prop} is ${typeof value}, expected object`)
        continue
      }

      const innerErrors = validateBody(bodyType as any, value, {
        prefix: prop,
        partial: opts.partial,
        notThrow: true,
      })
      errors.push(...innerErrors)
      continue
    }
  }

  if (!opts.notThrow) {
    throw new Error(`Object does not match type: ${errors.join(', ')}`)
  }

  return errors
}

function isPrimitive(value: any): value is Primitive {
  return typeof value === 'string' && (value === 'string' || value === 'boolean' || value === 'number')
}

function isTuplePrimitive(value: any): value is [Primitive] {
  if (Array.isArray(value) === false) return false
  if (value.length !== 1) return false
  if (!isPrimitive(value[0])) return false
  return true
}

function isTupleBody(value: any): value is [Validator] | readonly [Validator] {
  if (Array.isArray(value) === false) return false
  if (value.length !== 1) return false
  return typeof value[0] === 'object'
}

function isUnion<T extends string>(value: any): value is [T] {
  if (Array.isArray(value) === false) return false
  if (value.length < 1) return false
  if (isPrimitive(value[0])) return false

  return true
}
