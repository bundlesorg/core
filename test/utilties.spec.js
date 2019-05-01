/* eslint-env jest */
import _ from '../src/utilities.js'

describe('Utility functions', () => {
  test('is a true Object', () => {
    expect.assertions(6)
    expect(_.isObject({})).toBe(true)
    expect(_.isObject(null)).toBe(false)
    expect(_.isObject(undefined)).toBe(false)
    expect(_.isObject([])).toBe(false)
    expect(_.isObject('')).toBe(false)
    expect(_.isObject(new Date())).toBe(false)
  })

  test('convert a comma-separated String to Array', () => {
    expect.assertions(2)
    expect(_.convertStringToArray('one,  two,three')).toEqual(['one', 'two', 'three'])
    expect(_.convertStringToArray(['one', 'two', 'three'])).toEqual(['one', 'two', 'three'])
  })

  test('does string id exist in a value?', () => {
    expect.assertions(1)
    expect(_.idExistsInValue('one,   two,three', 'two')).toBe(true)
  })

  test('require a module without failure', () => {
    expect.assertions(1)
    expect(_.requireModule('no-existy-nope-not-here', { logToConsole: false })).toBe(undefined)
  })

  test.skip('get children modules', () => {})

  test('get time difference in seconds or milliseconds', () => {
    expect.assertions(2)
    const start = new Date()
    expect(_.getTimeDiff(start, { end: new Date(start.getTime() - 200) })).toBe('200ms')
    expect(_.getTimeDiff(start, { end: new Date(start.getTime() + 2230) })).toBe('2.23s')
  })
})
