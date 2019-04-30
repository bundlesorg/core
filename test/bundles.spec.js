/* eslint-env jest */
import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import matter from 'gray-matter'
import Bundles from '../src/bundles.js'
import { isSuccessfulBundle, isValidBundle, isSuccessfulResult, isValidResult, isValidFile } from './validations.js'

log.setLevel('silent')

afterEach(() => {
  fs.removeSync('.repos')
  fs.removeSync('.temp')
  Bundles.reset()
})

describe('Bundles end to end', () => {
  test('run single bundle', () => {
    expect.assertions(2)
    return Bundles.run({
      input: 'test/fixtures/simple.md',
      bundlers: [bundle => bundle]
    }).then(result => {
      isSuccessfulResult(result, { watching: false, configFile: null })
      result.bundles.forEach(bundle => isSuccessfulBundle(bundle, { id: '0' }))
    })
  })

  test('run multiple bundles', () => {
    expect.assertions(6)
    return Bundles.run({
      bundles: [{
        input: ['test/fixtures/*.md'],
        bundlers: [bundle => bundle, appendText]
      }, {
        input: ['test/fixtures/simple.md'],
        bundlers: [{
          run: appendText,
          text: '\n\nI have been appended also.'
        }]
      }]
    }).then(result => {
      const expectedFiles = [[{
        source: {
          path: 'test/fixtures/front-matter.md'
        },
        content: matter.read('test/fixtures/front-matter.md').content + '\n\nI have been appended.'
      }, {
        source: {
          path: 'test/fixtures/simple.md'
        },
        content: fs.readFileSync('test/fixtures/simple.md', 'utf8') + '\n\nI have been appended.'
      }], [{
        source: {
          path: 'test/fixtures/simple.md'
        },
        content: fs.readFileSync('test/fixtures/simple.md', 'utf8') + '\n\nI have been appended also.'
      }]]
      isSuccessfulResult(result)
      result.bundles.forEach((bundle, bundleIndex) => {
        isSuccessfulBundle(bundle)
        bundle.output.forEach((file, fileIndex) => isValidFile(file, expectedFiles[bundleIndex][fileIndex]))
      })
    })
  })

  test('skip invalid bundles and bundlers', () => {
    expect.assertions(8)
    return Bundles.run({ bundles: [{
      id: 'one',
      input: ['test/fixtures/simple.md'],
      bundlers: ['./test/fixtures/bundlers/append-new-lines.js', { run: './test/fixtures/bundlers/add-props.js', prop: 'test', value: 123 }]
    }, {
      id: 'two',
      input: ['test/fixtures/simple.md'],
      bundlers: ['./test/fixtures/bundlers/append-new-lines.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 123 }]
    }, {
      id: 'three',
      input: ['test/fixtures/simple.md'],
      bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-props.js', prop: 'test', value: 123 }]
    }, {
      id: 'four',
      input: ['test/fixtures/simple.md'],
      bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 123 }]
    }] }).then(result => {
      isValidResult(result)
      expect(result.bundles.length).toBe(4)

      const bundle1 = result.bundles[0]
      const bundle2 = result.bundles[1]
      const bundle3 = result.bundles[2]
      const bundle4 = result.bundles[3]

      isValidBundle(bundle1, { success: false, valid: false })
      isValidBundle(bundle2, { success: false, test: 123 })
      isValidBundle(bundle3, { success: false })
      expect(bundle3.output[0].content).toBe(bundle3.output[0].source.content + '\n')
      isValidBundle(bundle4, { success: true, test: 123 })
      expect(bundle4.output[0].content).toBe(bundle4.output[0].source.content + '\n')
    })
  })

  test('run with global, regional and local `data`', () => {
    expect.assertions(5)
    return Bundles.run({ bundles: [{
      id: 'global',
      input: ['test/fixtures/simple.md'],
      bundlers: [bundle => bundle]
    }, {
      id: 'regional',
      input: ['test/fixtures/simple.md'],
      data: {
        regional: true,
        winner: 'regional'
      },
      bundlers: [bundle => bundle]
    }, {
      id: 'local',
      input: ['test/fixtures/front-matter.md'],
      data: {
        regional: true,
        winner: 'regional'
      },
      bundlers: [bundle => bundle]
    }],
    data: {
      global: true,
      winner: 'global'
    } }).then(result => {
      isSuccessfulResult(result)
      expect(result.bundles.length).toBe(3)
      result.bundles.forEach(bundle => {
        isValidFile(bundle.output[0], {
          data: {
            winner: bundle.id
          }
        })
      })
    })
  })

  test.skip('run with global/regional data as a function', () => {})

  test('run with options.run (run only specified bundles)', () => {
    expect.assertions(5)
    return Bundles.run([{
      id: 'one',
      input: 'test/fixtures/simple.md',
      bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 1 }]
    }, {
      id: 'two',
      input: 'test/fixtures/simple.md',
      bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 12 }]
    }, {
      id: 'three',
      input: 'test/fixtures/simple.md',
      bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 123 }]
    }], { run: ['two'] }).then(result => {
      const expected = {
        one: {
          id: 'one',
          success: 'skipped',
          test: undefined
        },
        two: {
          id: 'two',
          success: true,
          test: 12
        },
        three: {
          id: 'three',
          success: 'skipped',
          test: undefined
        }
      }
      isSuccessfulResult(result)
      result.bundles.forEach((bundle, i) => isSuccessfulBundle(bundle, expected[bundle.id]))
      isValidFile(result.bundles[1].output[0], {
        source: {
          path: 'test/fixtures/simple.md'
        },
        content: result.bundles[1].output[0].source.content + '\n'
      })
    })
  })

  test('run with options.cwd', () => {
    expect.assertions(3)
    return Bundles.run({
      bundles: [{
        input: 'simple.md',
        bundlers: [bundle => bundle]
      }],
      options: {
        cwd: 'test/fixtures'
      }
    }).then(result => {
      const expected = [{
        bundle: {
          input: ['test/fixtures/simple.md']
        },
        output: [{
          source: {
            path: 'simple.md',
            cwd: 'test/fixtures',
            content: '# Simple Test\n\nThis is a test.\n'
          },
          content: '# Simple Test\n\nThis is a test.\n'
        }]
      }]
      isSuccessfulResult(result)
      result.bundles.forEach((bundle, bundleIndex) => {
        isSuccessfulBundle(bundle, expected[bundleIndex].bundle)
        bundle.output.forEach((file, fileIndex) => isValidFile(file, expected[bundleIndex].output[fileIndex]))
      })
    })
  })

  test('run complex example', () => {
    expect.assertions(22)
    return Bundles.run({
      bundles: {
        id: 'node',
        input: ['src', '.*.{js,yml}', '.browserslistrc', 'package.xjson', 'README.md'],
        data: require('./fixtures/examples/complex/.seed/.bundles-node.js'),
        bundlers: [{
          run: '@bundles/bundles-filters',
          filters: [{
            reverse: true,
            pattern (file) {
              const data = file.data
              return (file.source.path === 'src/cli.js' && !data.features.cli) ||
                  (file.source.path === '.rolluprc.js' && !data.features.rollup) ||
                  (['.browsersyncrc.js', '.shotsrc.js', '.browserslistrc'].includes(file.source.path) && !data.features.browser) ||
                  (['.postcssrc.js', '.stylelintrc.js'].includes(file.source.path) && !data.features.css) ||
                  (file.source.path === '.jestrc.js' && !data.features.jest)
            }
          }]
        }, {
          run: '@bundles/bundles-ejs'
        }, {
          run: '@bundles/bundles-banner'
        }, {
          run: '@bundles/bundles-banner',
          options: {
            include: ['.yml'],
            prefix: '#! ',
            suffix: ' #'
          }
        }, {
          run: '@bundles/bundles-output',
          options: {
            to (file) {
              if (file.source.path === 'package.xjson') {
                file.to = 'package.json'
                return path.join('.temp', file.to)
              }
              return path.join('.temp', file.source.path)
            }
          }
        }]
      },
      options: { cwd: 'test/fixtures/examples/complex' }
    }).then(result => {
      isSuccessfulResult(result)
      result.bundles.forEach((bundle, bundleIndex) => {
        isSuccessfulBundle(bundle)
        bundle.output.forEach((file, fileIndex) => {
          isValidFile(file)
          const expected = fs.readFileSync(path.join('test/fixtures/expected/node', file.to || file.source.path), 'utf8')
          const actual = fs.readFileSync(path.join('.temp', file.to || file.source.path), 'utf8')
          expect(actual.trim()).toBe(expected.trim())
        })
      })
    })
  })

  test('run complex example with different data', () => {
    expect.assertions(36)
    return Bundles.run({
      options: { cwd: 'test/fixtures/examples/complex' },
      bundles: {
        id: 'seed',
        input: ['src', '.*.{js,yml}', '.browserslistrc', 'package.xjson', 'README.md'],
        data: require('./fixtures/examples/complex/.seed/.bundles-browser.js'),
        bundlers: [{
          run: '@bundles/bundles-filters',
          filters: [{
            reverse: true,
            pattern (file) {
              const data = file.data
              return (file.source.path === 'src/cli.js' && !data.features.cli) ||
                  (file.source.path === '.rolluprc.js' && !data.features.rollup) ||
                  (['.browsersyncrc.js', '.shotsrc.js', '.browserslistrc'].includes(file.source.path) && !data.features.browser) ||
                  (['.postcssrc.js', '.stylelintrc.js'].includes(file.source.path) && !data.features.css) ||
                  (file.source.path === '.jestrc.js' && !data.features.jest)
            }
          }]
        }, {
          run: '@bundles/bundles-ejs'
        }, {
          run: '@bundles/bundles-banner'
        }, {
          run: '@bundles/bundles-banner',
          options: {
            include: ['.yml'],
            prefix: '#! ',
            suffix: ' #'
          }
        }, {
          run: '@bundles/bundles-output',
          options: {
            to (file) {
              if (file.source.path === 'package.xjson') {
                file.to = 'package.json'
                return path.join('.temp', file.to)
              }
              return path.join('.temp', file.source.path)
            }
          }
        }]
      }
    }).then(result => {
      isSuccessfulResult(result)
      result.bundles.forEach((bundle, bundleIndex) => {
        isSuccessfulBundle(bundle)
        bundle.output.forEach((file, fileIndex) => {
          isValidFile(file)
          const expected = fs.readFileSync(path.join('test/fixtures/expected/browser', file.to || file.source.path), 'utf8')
          const actual = fs.readFileSync(path.join('.temp', file.to || file.source.path), 'utf8')
          expect(actual.trim()).toBe(expected.trim())
        })
      })
    })
  })

  if (process.env.GH_TOKEN) {
    test('run with a github repo as source input', () => {
      expect.assertions(3)
      return Bundles.run({ bundles: [{
        input: [
          `https://${process.env.GH_TOKEN}@github.com/thezimmee/test.git`,
          `gh:${process.env.GH_TOKEN}@brikcss/boot-test`
        ],
        bundlers: [bundle => bundle]
      }] }).then(result => {
        isSuccessfulResult(result)
        expect(result.bundles.length).toBe(1)
        expect(result.bundles[0]).toMatchObject({
          success: true,
          input: expect.arrayContaining([
            '.repos/thezimmee/test/README.md',
            '.repos/brikcss/boot-test/README.md',
            '.repos/brikcss/boot-test/TODO.md.xjs',
            '.repos/brikcss/boot-test/package.xjson'
          ])
        })
      })
    })
  }
})

function appendText (bundle = {}, bundler = {}) {
  bundle.output = bundle.output.map(file => {
    file.content += bundler.text || '\n\nI have been appended.'
    return file
  })
  return bundle
}
