import { expect } from 'chai'
import { isValid, isValidPartial, validateBody, Validator } from '.'

const simple = {
  astring: 'string',
  anumber: 'number',
  aboolean: 'boolean',
} as const

const complex = {
  id: 'string',
  name: 'string',
  location: {
    country: 'string',
    state: 'string',
  },
} as const

const arrays = {
  strings: ['string'],
  booleans: ['boolean'],
  numbers: ['number'],
  objects: [simple],
} as const

const literal = {
  kind: ['a', 'b', 'c'],
} as const

const optionals = {
  str: 'string?',
  num: 'number?',
  bool: 'boolean?',
} as const

const optarrays = {
  str: ['string?'],
  num: ['number?'],
  bool: ['boolean?'],
}

type Test = {
  it: string
  using: Validator
  input: any
  expect?: boolean // Defaults to true
  partial?: boolean // Defaults to false
}

const tests: Test[] = [
  {
    it: 'will validate empty and non-empty required arrays',
    using: { one: ['string'], two: ['string'], three: ['string'] },
    input: {
      one: ['one'],
      two: [],
      three: ['three'],
    },
    partial: false,
    expect: true,
  },
  {
    it: 'validate a simple object with each primitive',
    using: simple,
    input: { astring: 'a', anumber: 42, aboolean: true },
    expect: true,
  },
  {
    ...tosimple('invalidate number as string'),
    input: { astring: 42 },
    expect: false,
  },
  {
    ...tosimple('invalidate string of "true" as boolean'),
    input: { aboolean: 'true' },
    expect: false,
  },
  {
    it: 'validate a nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au', state: 'nsw' } },
    expect: true,
  },
  {
    it: 'invalidate missing property on nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au' } },
    expect: false,
  },
  {
    it: 'partially validate missing property on nested object',
    using: complex,
    input: { id: '1', name: 'name', location: { country: 'au' } },
    partial: true,
  },
  {
    ...toarray('validate array types'),
    input: {
      booleans: [true, false],
      strings: ['a', 'b', 'c'],
      numbers: [1, 2, 3],
      objects: [
        { astring: 'a', anumber: 1, aboolean: true },
        { astring: 'b', anumber: 2, aboolean: false },
      ],
    },
    partial: false,
  },
  {
    ...toarray('invalidate string array containing numbers'),
    input: { strings: ['a', 'b', 1] },
    expect: false,
  },
  {
    ...toarray('invalidate string array containing booleans'),
    input: { strings: ['a', 'b', false] },
    expect: false,
  },
  {
    ...toarray('invalidate number array containing strings'),
    input: { numbers: [1, 2, 3, '4'] },
    expect: false,
  },
  {
    ...toarray('invalidate number array containing booleans'),
    input: { numbers: [1, 2, 3, false] },
    expect: false,
  },
  {
    ...toarray('invalidate boolean array containing strings'),
    input: { booleans: [true, false, '4'] },
    expect: false,
  },
  {
    ...toarray('invalidate object array containing strings'),
    input: { objects: [{ astring: 'a', anumber: 1, aboolean: true }, 'foo'] },
    expect: false,
  },
  {
    ...toarray('validate arrays with no elements'),
    input: { strings: [], numbers: [], booleans: [], objects: [] },
    expect: true,
  },
  {
    ...toliteral('invalidate literal when value is number'),
    input: { kind: 42 },
    expect: false,
  },
  {
    ...toliteral('invalidate literal when value is boolean'),
    input: { kind: true },
    expect: false,
  },
  {
    ...toliteral('invalidate literal when value is array'),
    input: { kind: ['value'] },
    expect: false,
  },
  {
    ...toliteral('invalidate literal when value is object'),
    input: { kind: { value: '42' } },
    expect: false,
  },
  {
    ...toliteral('invalidate literal when string value is not in union'),
    input: { kind: 'd' },
    expect: false,
  },
  {
    ...toliteral('validate literal when string value is in union'),
    input: { kind: 'a' },
    expect: true,
  },
  {
    ...toliteral('validate literal when string value last member of union'),
    input: { kind: 'c' },
    expect: true,
  },
  {
    ...toOptional('validate optional primitives with values'),
    input: { str: 'value', num: 42, bool: true },
    expect: true,
  },
  {
    ...toOptional('invalidate optional string with incorrect type'),
    input: { str: 42 },
    expect: false,
  },
  {
    ...toOptional('invalidate optional number with incorrect type'),
    input: { num: '42' },
    expect: false,
  },
  {
    ...toOptional('invalidate optional boolean with incorrect type'),
    input: { bool: 'true' },
    expect: false,
  },
  {
    ...toOptional('invalidate optional primitive with null as value'),
    input: { str: null },
    expect: false,
  },
  {
    ...toOptional('validate optional primitives when undefined'),
    input: { str: undefined, num: undefined, bool: undefined },
    expect: true,
  },
  {
    ...toOptArray('validate optional arary with values'),
    input: { str: ['abc', 'def'], num: [1, 2, 3], bool: [true, false] },
    expect: true,
  },
  {
    ...toOptArray('validate optional arary when undefined'),
    input: { str: undefined, num: undefined, bool: undefined },
    expect: true,
  },
  {
    ...toOptArray('invalidate optional string arary with incorrect element types'),
    input: { str: ['abc', 42] },
    expect: false,
  },
  {
    ...toOptArray('invalidate optional number arary with incorrect element types'),
    input: { num: [1, 2, 3, 4, '42'] },
    expect: false,
  },
  {
    ...toOptArray('invalidate optional boolean arary with incorrect element types'),
    input: { bool: [true, false, 'true'] },
    expect: false,
  },
  {
    it: 'will validate property using any and unknown',
    input: { any: { bar: 42 }, unknown: { foo: 84 } },
    using: { any: 'any', unknown: 'unknown' },
    expect: true,
  },
  {
    it: 'will validate property using optional any and optional unknown',
    input: { any: { bar: 42 }, unknown: { foo: 84 } },
    using: { any: 'any?', unknown: 'unknown?' },
    expect: true,
  },
  {
    it: 'will invalidate property using any when prop is undefined',
    input: { unknown: { foo: 84 } },
    using: { any: 'any', unknown: 'unknown' },
    expect: false,
  },
  {
    it: 'will invalidate property using unknown when prop is undefined',
    input: { any: 42 },
    using: { unknown: 'unknown' },
    expect: false,
  },
  {
    it: 'will validate property using any? and unknown? when props are undefined',
    input: { empty: true },
    using: { unknown: 'unknown?', any: 'any?' },
    expect: true,
  },
  {
    it: 'will validate property using array of any',
    input: { any: [{ one: '1' }] },
    using: { any: ['any'] },
    expect: true,
  },
  {
    it: 'will invalidate property using array of any and value undefined',
    input: { any: undefined },
    using: { any: ['any'] },
    expect: false,
  },
  {
    it: 'will validate property using array of optional any when value undefined',
    input: { any: undefined },
    using: { any: ['any?'] },
    expect: true,
  },
  {
    it: 'will validate property using array of optional any when value provided',
    input: { any: [1, { foo: 42 }] },
    using: { any: ['any?'] },
    expect: true,
  },
  {
    it: 'will validate input being optional and value is undefined',
    input: undefined,
    using: { foo: 'string', '?': '?' },
    expect: true,
  },
  {
    it: 'will validate input being optional and value is provided',
    input: { foo: 'abc' },
    using: { foo: 'string', '?': '?' },
    expect: true,
  },
  {
    it: 'will validate input being optional and value is not provided',
    input: { foo: undefined },
    using: { foo: [{ a: 'string' }, '?'] },
    expect: true,
  },
  {
    it: 'will not validate input when input is optional, but value is mismatched',
    input: { b: 42 },
    using: { a: 'string', '?': '?' },
    expect: false,
  },
  {
    it: 'will validate input being optional and value is provided',
    input: { foo: [{ a: 'abc' }] },
    using: { foo: [{ a: 'string' }, '?'] },
    expect: true,
  },
  {
    it: 'will not validate when prop is optional object array, but value is mismatch',
    input: { foo: ['a'] },
    using: { foo: [{ a: 'string' }, '?'] },
    expect: false,
  },
]

describe('validation tests', () => {
  let count = 0
  for (const test of tests) {
    count++
    it(`#${count}. will ${test.it}`, () => {
      const actual = test.partial
        ? isValidPartial(test.using, test.input)
        : isValid(test.using, test.input)
      let msg = ''
      if (actual !== test.expect) {
        msg = validateBody(test.using, test.input, { notThrow: true, partial: test.partial }).join(
          ', '
        )
      }
      expect(actual, msg).to.equal(test.expect ?? true)
    })
  }
})

function tosimple(msg: string) {
  return {
    it: msg,
    using: simple,
    partial: true,
  }
}

function toOptional(msg: string) {
  return {
    it: msg,
    using: optionals,
  }
}

function toarray(msg: string) {
  return {
    it: msg,
    using: arrays,
    partial: true,
  }
}

function toOptArray(msg: string) {
  return {
    it: msg,
    using: optarrays,
    partial: false,
  }
}

function toliteral(msg: string) {
  return {
    it: msg,
    using: literal,
    partial: false,
  }
}
