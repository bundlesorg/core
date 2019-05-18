/* eslint-env jest */
import fs from 'fs-extra'
import Bundle from '../src/bundle.js'
import './jest-extended.js'

describe('Bundle constructor', () => {
  test('bundle with invalid input is invalid', () => {
    expect.assertions(3)
    const bundle = new Bundle()
    // Validations doesn't allow undefined value, so as a workaround, assert that input is undefined
    // first, then validate the rest of the bundle.
    expect(bundle.input).toBeUndefined()
    bundle.input = new Map()
    expect(bundle).toMatchBundle({ id: '0', valid: false })
    const bundle2 = new Bundle({ id: 1, input: 123 })
    expect(bundle2).toMatchBundle({ id: '1', valid: false, input: 123 }, { input: 'number' })
  })

  test('bundle with no bundlers is invalid', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'bundlers', input: 'src' })
    expect(bundle).toMatchBundle({ id: 'bundlers', valid: false, bundlers: [] })
  })

  test('bundle with input and bundles is valid and outputs correctly', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'source', input: 'src/bundles.js', bundlers: [(bundle) => bundle] })
    expect(bundle).toMatchBundle({ valid: true, input: ['src/bundles.js'], output: [{ source: { path: 'src/bundles.js', data: expect.any(Object), isEmpty: expect.any(Boolean), cwd: expect.any(String) }, encoding: 'utf8', isBuffer: false, data: expect.any(Object) }] })
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
    expect(bundle).toMatchBundle({
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
      expect(result).toMatchBundle({
        id: 'invalid',
        valid: false,
        success: false
      }, { input: 'undefined' })
    })
  })

  test('do not run if not configured to run', () => {
    expect.assertions(1)
    const bundle = new Bundle({ id: 'no-run', input: ['src/bundles.js'], bundlers: [bundle => bundle], options: { run: 'none' } })
    return bundle.run().then(result => {
      expect(result).toMatchBundle({
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
      expect(result).toMatchBundle({
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
      expect(result).toMatchBundle({
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
    bundle.watcher = {}
    return bundle.run(true).then(result => {
      expect(result).toMatchBundle({
        id: 'watch',
        valid: true,
        success: true,
        watching: true,
        watcher: {},
        options: {
          watch: 'watch'
        }
      })
    })
  })

  test('watch a bundle', (done) => {
    expect.assertions(1)
    const bundle = new Bundle({
      id: 'watch',
      input: ['src/bundles.js'],
      bundlers: [bundle => bundle],
      options: { watch: 'watch', watchFiles: ['src/bundle*.js'] },
      on: {
        watching (bundle) {
          bundle.watcher.close()
          expect(bundle).toMatchBundle({
            id: 'watch',
            valid: true,
            success: true,
            watching: true,
            watcher: {
              closed: true
            },
            options: {
              watch: 'watch',
              watchFiles: ['src/bundle*.js']
            }
          })
          done()
        }
      }
    })
    bundle.run()
  })
})
