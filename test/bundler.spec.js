/* eslint-env jest */
import log from 'loglevel'
import './jest-extended.js'
import Bundler from '../src/bundler.js'
log.setLevel('silent')

describe('Bundler constructor', () => {
  test('as a node module', () => {
    expect.assertions(1)
    expect(new Bundler('@bundles/bundles-output')).toMatchBundler()
  })

  test('as a Function', () => {
    expect.assertions(1)
    expect(new Bundler((bundler) => bundler)).toMatchBundler()
  })

  test('as an Object', () => {
    expect.assertions(1)
    expect(new Bundler({
      run: (bundler) => bundler
    })).toMatchBundler()
  })

  test('as an Object with run as a String', () => {
    expect.assertions(1)
    const bundler = new Bundler({
      run: './test/fixtures/bundlers/add-prop.js'
    })
    expect(bundler).toMatchBundler()
  })

  test('invalidate if invalid node module', () => {
    expect.assertions(1)
    const bundler = new Bundler('@bundles/bundles-outputs')
    expect(bundler).toMatchBundler({ valid: false, run: '@bundles/bundles-outputs' })
  })

  test('invalidate if run is not a Function', () => {
    expect.assertions(1)
    const bundler = new Bundler({
      run: 123
    })
    expect(bundler).toMatchBundler({ valid: false, run: 123 }, { run: 'number' })
  })
})
