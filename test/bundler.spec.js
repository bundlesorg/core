/* eslint-env jest */
import log from 'loglevel'
import Bundler from '../src/bundler.js'
import { isValidBundler } from './validations.js'
log.setLevel('silent')

describe('Bundler constructor', () => {
  test('as a node module', () => {
    expect.assertions(1)
    isValidBundler(new Bundler('@bundles/bundles-output'))
  })

  test('as a Function', () => {
    expect.assertions(1)
    isValidBundler(new Bundler((bundler) => bundler))
  })

  test('as an Object', () => {
    expect.assertions(1)
    isValidBundler(new Bundler({
      run: (bundler) => bundler
    }))
  })

  test('as an Object with run as a String', () => {
    expect.assertions(1)
    isValidBundler(new Bundler({
      run: './test/fixtures/bundlers/add-prop.js'
    }))
  })

  test('invalidate if invalid node module', () => {
    expect.assertions(1)
    const bundler = new Bundler('@bundles/bundles-outputs')
    isValidBundler(bundler, { valid: false, run: '@bundles/bundles-outputs' })
  })

  test('invalidate if run is not a Function', () => {
    expect.assertions(1)
    const bundler = new Bundler({
      run: 123
    })
    isValidBundler(bundler, { valid: false, run: 123 })
  })
})
