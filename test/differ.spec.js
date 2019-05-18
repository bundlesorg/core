/* eslint-env jest */
import { diff, typesDiff } from '../src/utilities/differ'

describe('basic diffs', () => {
  let left = { a: 'abc', b: 123, c: new Date(), d: true, e: 'only in left' }
  let right = { a: 'xyz', b: 123, c: new Date(2001, 1, 1), d: undefined, f: 'only in right' }

  it('diff a simple object', () => {
    expect.assertions(5)
    let diffs = diff(left, right)
    let expected = [
      {
        path: 'a',
        type: 'changed',
        source: {
          type: '<string>',
          value: 'abc'
        },
        target: {
          type: '<string>',
          value: 'xyz'
        }
      }, {
        path: 'c',
        type: 'changed',
        source: {
          type: '<date>',
          value: left.c
        },
        target: {
          type: '<date>',
          value: right.c
        }
      }, {
        path: 'd',
        type: 'removed',
        source: {
          type: '<boolean>',
          value: true
        },
        target: {
          type: '<undefined>',
          value: undefined
        }
      }, {
        path: 'e',
        type: 'removed',
        source: {
          type: '<string>',
          value: 'only in left'
        },
        target: {
          type: '<undefined>',
          value: undefined
        }
      }, {
        path: 'f',
        type: 'added',
        source: {
          type: '<undefined>',
          value: undefined
        },
        target: {
          type: '<string>',
          value: 'only in right'
        }
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('diff a simple array', () => {
    expect.assertions(4)
    const diffs = diff([1, 'b', 2], ['a', 'b', 3, 'c', 5])
    const expected = [
      {
        path: '0',
        type: 'type'
      }, {
        path: '2',
        type: 'changed'
      }, {
        path: '3',
        type: 'added'
      }, {
        path: '4',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  let a = { a: 'abc', b: 123, c: new Date(), d: true, e: 'only in a', x: [{ x1: 123, x2: 456 }, { x1: 'abc', x2: 'def' }] }
  let b = { a: 'abc', b: 123, c: new Date(), d: true, e: 'only in a', x: [{ x1: 123, x2: 456 }, { x1: 'abc', x2: 'def' }] }

  it('equal objects returns an empty array', () => {
    let diffs = diff(a, b)
    expect(diffs.length).toBe(0)
  })

  it('equal objects with difference in properties order return empty array', () => {
    a = { a: 'abc', b: 123, c: new Date(), d: true, e: 'only in a', x: [{ x1: 123, x2: 456 }, { x1: 'abc', x2: 'def' }] }
    b = { x: [{ x1: 123, x2: 456 }, { x1: 'abc', x2: 'def' }], e: 'only in a', a: 'abc', b: 123, c: new Date(), d: true }
    let diffs = diff(a, b)
    expect(diffs.length).toBe(0)
  })
})

describe('deep object difference comparison', () => {
  it('diff nested object', () => {
    expect.assertions(2)
    const diffs = diff({
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: 'yup'
                }
              }
            }
          }
        }
      }
    }, {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: 'nope',
                  h: 'indeed'
                }
              }
            }
          }
        }
      }
    })
    const expected = [
      {
        path: 'a.b.c.d.e.f.g',
        type: 'changed'
      }, {
        path: 'a.b.c.d.e.f.h',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('diff two arrays of same length', () => {
    expect.assertions(4)
    const diffs = diff([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])
    const expected = [
      {
        path: '0',
        type: 'changed'
      }, {
        path: '1',
        type: 'changed'
      }, {
        path: '3',
        type: 'changed'
      }, {
        path: '4',
        type: 'changed'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('diff arrays of different length', () => {
    expect.assertions(5)
    const diffs = diff([1, 2, 3, 4], [3, 2, 1, 'a', 'b', 'c'])
    const expected = [
      {
        path: '0',
        type: 'changed'
      }, {
        path: '2',
        type: 'changed'
      }, {
        path: '3',
        type: 'type'
      }, {
        path: '4',
        type: 'added'
      }, {
        path: '5',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('difference between two simple value array', () => {
    expect.assertions(5)
    const left = { a: 'abc', b: 123, array1: [1, 2, 3] }
    const right = { a: 'xyz', b: 123, array1: [1, 3, 4, 5, 6] }
    const diffs = diff(left, right)
    const expected = [
      {
        path: 'a',
        type: 'changed'
      }, {
        path: 'array1.1',
        type: 'changed'
      }, {
        path: 'array1.2',
        type: 'changed'
      }, {
        path: 'array1.3',
        type: 'added'
      }, {
        path: 'array1.4',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('difference between two arrays of object', () => {
    expect.assertions(3)
    const left = {
      id: 90123,
      array1: [{ x: 1, y: 0, z: 9 }, { x: 3, y: 4 }],
      array2: [{ x: 1, y: 2 }, { time: { year: 1999, month: 'Aug' }, income: 2000 }]
    }
    const right = {
      id: 90123,
      array1: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
      array2: [{ x: 1, y: 2 }, { time: { year: 1999, month: 'Aug' }, income: 3000 }]
    }
    const diffs = diff(left, right)
    const expected = [
      {
        path: 'array1.0.y',
        type: 'changed'
      }, {
        path: 'array1.0.z',
        type: 'removed'
      }, {
        path: 'array2.1.income',
        type: 'changed'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('difference between an empty object and a created object', () => {
    expect.assertions(3)
    const left = {}
    const right = { id: 90123, array1: [{ x: 1, y: 2 }, { x: 3, y: 4 }], array2: [{ x: 1, y: 2 }, { time: { year: 1999, month: 'Aug' }, income: 3000 }] }
    const diffs = diff(left, right)
    const expected = [
      {
        path: 'id',
        type: 'added'
      }, {
        path: 'array1',
        type: 'added'
      }, {
        path: 'array2',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })
})

describe('non-iterable value diffs', () => {
  it('diff two non-iterable values', () => {
    expect.assertions(1)
    const diffs = diff('string', true)
    const expected = [
      {
        path: '',
        type: 'type',
        source: {
          type: '<string>',
          value: 'string'
        },
        target: {
          type: '<boolean>',
          value: true
        }
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('diff two equal non-iterable values', () => {
    expect.assertions(1)
    const diffs = diff(123, 123)
    expect(diffs).toEqual([])
  })

  it('diff two non-iterable values of the same type', () => {
    expect.assertions(1)
    const diffs = diff(false, true)
    const expected = [
      {
        path: '',
        type: 'changed'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('diff an iterable with a non-iterable value', () => {
    expect.assertions(1)
    const diffs = diff('string', { string: 'string' })
    const expected = [
      {
        path: '',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })
})

describe('run with configuration', () => {
  it('flattens and renames source and target properties', () => {
    expect.assertions(1)
    const diffs = diff({ a: 'abc' }, { a: 'xyz' }, { flatten: true, source: 'a', target: 'b' })
    const expected = [
      {
        path: 'a',
        type: 'changed',
        aType: '<string>',
        aValue: 'abc',
        bType: '<string>',
        bValue: 'xyz'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('returns only diffs with values on both sides in expected mode', () => {
    expect.assertions(1)
    const diffs = diff({
      a: 'a',
      b: 'b',
      nest: {
        one: 123,
        four: 456
      }
    }, {
      b: 'b',
      nest: {
        four: 456
      }
    }, { mode: 'expected' })
    expect(diffs).toEqual([])
  })
})

describe('type diffs', () => {
  const date = new Date()
  let a = {
    string: 'abc',
    number: 123,
    boolean: true,
    undefined: undefined,
    null: null,
    date,
    array: [1, 2, 3],
    nestedArray: [1, 'a'],
    object: { one: 1, two: 2, three: 3 },
    nestedObject: {
      a: 'a',
      b: 'b',
      c: {
        '1': 1,
        '2': {
          '3': {
            x: 'x',
            y: 'y',
            z: 'z'
          }
        }
      }
    }
  }
  const b = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    undefined: 'undefined',
    null: 'null',
    date: 'date',
    array: 'array',
    object: 'object',
    nestedArray: ['number', 'string'],
    nestedObject: {
      a: 'string',
      b: 'string',
      c: {
        '1': 'number',
        '2': {
          '3': {
            x: 'string',
            y: 'string',
            z: 'string'
          }
        }
      }
    }
  }

  it('equal objects return empty array', () => {
    expect.assertions(1)
    const diffs = typesDiff(a, b)
    expect(diffs.length).toBe(0)
  })

  it('complex objects return diffs', () => {
    expect.assertions(8)
    a = {
      string: 'abc',
      number: 123,
      // boolean: true,
      boolean: 'true',
      undefined: undefined,
      null: null,
      // date,
      date: '1999',
      // array: [1, 2, 3],
      // nestedArray: [1, 'a'],
      nestedArray: [3, 2],
      object: { one: 1, two: 2, three: 3 },
      nestedObject: {
        a: 'a',
        b: 'b',
        c: {
          // '1': 1,
          '1': '1',
          '2': {
            // '3': {
            //   x: 'x',
            //   y: 'y',
            //   z: 'z'
            // }
            '3': 'three'
          }
        }
      }
    }
    const diffs = typesDiff(a, b)
    const expected = [
      {
        path: 'boolean',
        type: 'type'
      }, {
        path: 'date',
        type: 'type'
      }, {
        path: 'nestedArray.1',
        type: 'type'
      }, {
        path: 'nestedObject.c.1',
        type: 'type'
      }, {
        path: 'nestedObject.c.2.3.x',
        type: 'type'
      }, {
        path: 'nestedObject.c.2.3.y',
        type: 'type'
      }, {
        path: 'nestedObject.c.2.3.z',
        type: 'type'
      }, {
        path: 'array',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('a simple array returns diffs', () => {
    expect.assertions(2)
    const diffs = typesDiff([1, 'b', 2], ['string', 'string', 'number', 'number,undefined', 'number'])
    const expected = [
      {
        path: '0',
        type: 'type'
      }, {
        path: '4',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('a nested array returns diffs', () => {
    expect.assertions(1)
    const diffs = typesDiff([
      { one: 1, two: [1, 2, 3] },
      { a: { b: 1, c: 'c' } }
    ], ['object', {
      a: {
        b: 'string',
        c: 'number,string'
      }
    }])
    const expected = [
      {
        path: '1.a.b',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })
})

describe('non-iterable type diffs', () => {
  it('number with string type map returns empty array', () => {
    expect.assertions(1)
    expect(typesDiff(123, 'number')).toEqual([])
  })

  it('string without type map returns diffs', () => {
    expect.assertions(1)
    const diffs = typesDiff('I am string', 'not a map')
    const expected = [
      {
        path: '',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('same types return diff if second value is not a type map', () => {
    expect.assertions(1)
    const diffs = typesDiff(123, 456)
    const expected = [
      {
        path: '',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })

  it('unequal types returns type diffs', () => {
    expect.assertions(1)
    const diffs = typesDiff(123, 'string')
    const expected = [
      {
        path: '',
        type: 'type'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })
})

describe('types and value diffs', () => {
  it('returns empty array if types and values are equal', () => {
    expect.assertions(1)
    const diffs = diff({ one: 1, two: 2, a: 'abc', nest: { one: 1, a: 'abc' } }, { two: 2, one: 1, nest: { one: 1, a: 'abc' }, a: 'abc' }, { typesMap: { one: 'number', two: 'number', a: 'string', nest: { one: 'number', a: 'string' } } })
    expect(diffs).toEqual([])
  })

  it('returns diffs if types or values are unequal', () => {
    expect.assertions(4)
    const diffs = diff({ one: '1', two: 2, a: 'abc', nest: { a: 'abc' } }, { two: 22, one: 1, nest: { one: 1, a: 'abc' }, a: 'abc' }, { typesMap: { one: 'number', two: 'number', a: 'string', nest: { one: 'number', a: 'number' } } })
    const expected = [
      {
        path: 'nest.a',
        type: 'type'
      }, {
        path: 'one',
        type: 'type'
      }, {
        path: 'two',
        type: 'changed'
      }, {
        path: 'nest.one',
        type: 'added'
      }
    ]
    diffs.forEach((diff, i) => expect(diff).toMatchObject(expected[i]))
  })
})
