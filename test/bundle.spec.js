/* eslint-env jest */
import fs from 'fs-extra'
import Bundle from '../src/bundle.js'
import { isValidBundle } from './validations.js'

describe('Bundle constructor', () => {
  test('bundle with invalid input is invalid', () => {
    expect.assertions(2)
    const bundle = new Bundle()
    isValidBundle(bundle, { id: '0', valid: false, input: [], output: [] })
    const bundle2 = new Bundle({ id: 1, input: 123 })
    isValidBundle(bundle2, { id: '1', valid: false, input: 123, output: [] })
  })

  test('bundle with no bundlers is invalid', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'bundlers', input: 'src' })
    isValidBundle(bundle, { id: 'bundlers', valid: false, bundlers: [] })
  })

  test('bundle with input and bundles is valid and outputs correctly', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'source', input: 'src/bundles.js', bundlers: [(bundle) => bundle] })
    isValidBundle(bundle, { id: 'source',
      valid: true,
      input: ['src/bundles.js'],
      output: [
        { source: { path: 'src/bundles.js', content: expect.any(String), data: expect.any(Object), isEmpty: expect.any(Boolean), cwd: expect.any(String) }, content: expect.any(String), encoding: 'utf8', isBuffer: false, data: expect.any(Object) }
      ] })
  })

  test('create bundle with mixture of input objects and paths', () => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'mix',
      input: [
        'src/bundles.js',
        {
          content: '# Test File\n\nThis is a test.\n',
          path: 'fake/file.md'
        },
        {
          content: fs.readFileSync('test/fixtures/assets/like.png'),
          path: 'fake/img.png'
        },
        'test/fixtures/assets/like.png'
      ],
      bundlers: [(bundle) => bundle]
    })
    isValidBundle(bundle, {
      id: 'mix',
      input: [
        'src/bundles.js',
        'fake/file.md',
        'fake/img.png',
        'test/fixtures/assets/like.png'
      ],
      output: [
        { source: { path: 'src/bundles.js', content: expect.any(String), data: expect.any(Object), isEmpty: expect.any(Boolean), cwd: expect.any(String) }, content: expect.any(String), encoding: 'utf8', isBuffer: false, data: expect.any(Object) },
        { source: { path: 'fake/file.md', content: expect.any(String), data: expect.any(Object), isEmpty: expect.any(Boolean), cwd: expect.any(String) }, content: expect.any(String), encoding: 'utf8', isBuffer: false, data: expect.any(Object) },
        { source: { path: 'fake/img.png', content: expect.any(Object), data: expect.any(Object), cwd: expect.any(String) }, content: expect.any(Object), encoding: 'binary', isBuffer: true, data: expect.any(Object) },
        { source: { path: 'test/fixtures/assets/like.png', content: expect.any(Object), data: expect.any(Object), cwd: expect.any(String) }, content: expect.any(Object), encoding: 'binary', isBuffer: true, data: expect.any(Object) }
      ]
    })
  })
})

describe('Bundle methods', () => {
  test('do not run an invalid bundle', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'invalid' })
    return bundle.run().then(result => {
      isValidBundle(result, {
        id: 'invalid',
        valid: false,
        success: false
      })
    })
  })

  test('do not run if not configured to run', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'no-run', input: ['src/bundles.js'], bundlers: [bundle => bundle], options: { run: 'none' } })
    return bundle.run().then(result => {
      isValidBundle(result, {
        id: 'no-run',
        valid: true,
        success: 'skipped',
        options: {
          run: 'none'
        }
      })
    })
  })

  test('run a bundle', () => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'run',
      input: ['src/bundles.js'],
      bundlers: [bundle => bundle]
    })
    return bundle.run().then(result => {
      isValidBundle(result, {
        id: 'run',
        valid: true,
        success: true
      })
    })
  })

  test('do not watch if not configured to do so', () => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'no-watch',
      input: ['src/bundles.js'],
      bundlers: [bundle => bundle],
      options: { watch: 'none' }
    })
    return bundle.run(true).then(result => {
      isValidBundle(result, {
        id: 'no-watch',
        valid: true,
        success: true,
        watching: false,
        watcher: undefined,
        options: {
          watch: 'none'
        }
      })
    })
  })

  test('do not watch if already watching', () => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'watch',
      input: ['src/bundles.js'],
      bundlers: [bundle => bundle],
      options: { watch: 'watch' }
    })
    // Mock a watching bundle.
    bundle.watching = true
    bundle.watcher = 'fixed'
    return bundle.run(true).then(result => {
      isValidBundle(result, {
        id: 'watch',
        valid: true,
        success: true,
        watching: true,
        watcher: 'fixed',
        options: {
          watch: 'watch'
        }
      })
    })
  })

  test('watch a bundle', () => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'watch',
      input: ['src/bundles.js'],
      bundlers: [bundle => bundle],
      options: { watch: 'watch', watchFiles: ['src/bundle*.js'] }
    })
    return bundle.run({ isTest: true }).then(result => {
      isValidBundle(result, {
        id: 'watch',
        valid: true,
        success: true,
        watching: true,
        watcher: expect.any(Object),
        options: {
          watch: 'watch',
          watchFiles: ['src/bundle.js', 'src/bundler.js']
        }
      })
    })
  })
})
