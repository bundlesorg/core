/* eslint-env jest */
import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import matter from 'gray-matter'
import Bundles from '../src/bundles.js'
import './jest-extended.js'

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
      expect(result).toMatchConfig({ configFile: '' })
      result.bundles.forEach(bundle => expect(bundle).toMatchBundle({ id: '0', success: true }))
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
      expect(result).toMatchConfig()
      result.bundles.forEach((bundle, bundleIndex) => {
        expect(bundle).toMatchBundle({ success: true })
        bundle.output.forEach((file, filepath) => expect(file).toMatchFile(expectedFiles[bundleIndex][filepath]))
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
      expect(result).toMatchConfig()
      expect(result.bundles.length).toBe(4)

      const bundle1 = result.bundles[0]
      const bundle2 = result.bundles[1]
      const bundle3 = result.bundles[2]
      const bundle4 = result.bundles[3]

      expect(bundle1).toMatchBundle({ success: false, valid: false })
      expect(bundle2).toMatchBundle({ success: false, test: 123 })
      expect(bundle3).toMatchBundle({ success: false })
      const bundle3output = Array.from(bundle3.output.values())
      expect(bundle3output[0].content).toBe(bundle3output[0].source.content + '\n')
      expect(bundle4).toMatchBundle({ success: true, test: 123 })
      const bundle4output = Array.from(bundle4.output.values())
      expect(bundle4output[0].content).toBe(bundle4output[0].source.content + '\n')
    })
  })

  test('run with global, regional and local `data`', () => {
    expect.assertions(5)
    return Bundles.run({ bundles: [{
      id: 'global',
      input: ['test/fixtures/front-matter.md'],
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
      id: 'regional',
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
      expect(result).toMatchConfig()
      expect(result.bundles.length).toBe(3)
      result.bundles.forEach(bundle => {
        const output = Array.from(bundle.output)[0][1]
        expect(output).toMatchFile({
          data: {
            winner: bundle.id
          }
        }, false)
      })
    })
  })

  test('run with global/regional data, as an Object or function', () => {
    expect.assertions(7)
    return Bundles.run({ bundles: [{
      id: 'markdown',
      input: ['test/fixtures/*.md'],
      bundlers: [bundle => bundle]
    }, {
      id: 'regional',
      input: ['src/bundle*.js'],
      data: (file) => {
        return {
          bundle: 'custom-' + file.bundle.id,
          source: file.source.path.replace('.js', '.nunya'),
          ext: '.nunya',
          winner: file.source.path.includes('bundles') ? 'regional' : 'none'
        }
      },
      bundlers: [bundle => bundle]
    }, {
      id: 'last',
      input: ['test/fixtures/front-matter.md'],
      data: {
        regional: true
      },
      bundlers: [bundle => bundle]
    }],
    data: (file) => {
      return {
        bundle: file.bundle.id,
        source: file.source.path,
        ext: path.extname(file.source.path)
      }
    } }).then(result => {
      expect(result).toMatchConfig()
      const expected = [
        [{
          bundle: 'markdown',
          source: 'test/fixtures/front-matter.md',
          ext: '.md',
          matter: true,
          winner: 'local'
        },
        {
          bundle: 'markdown',
          source: 'test/fixtures/simple.md',
          ext: '.md'
        }
        ],
        [{
          bundle: 'custom-regional',
          source: 'src/bundle.nunya',
          ext: '.nunya',
          winner: 'none'
        }, {
          bundle: 'custom-regional',
          source: 'src/bundler.nunya',
          ext: '.nunya',
          winner: 'none'
        }, {
          bundle: 'custom-regional',
          source: 'src/bundles.nunya',
          ext: '.nunya',
          winner: 'regional'
        }],
        [{
          bundle: 'last',
          source: 'test/fixtures/front-matter.md',
          ext: '.md',
          matter: true,
          regional: true,
          winner: 'local'
        }]
      ]
      let i = 0
      result.bundles.forEach((bundle, bi) => {
        i = 0
        bundle.output.forEach((file) => {
          expect(file.data).toMatchObject(expected[bi][i])
          i++
        })
      })
    })
  })

  test('run with options.run (run only specified bundles)', () => {
    expect.assertions(5)
    return Bundles.run({
      options: {
        run: ['two']
      },
      bundles: [{
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
      }]
    }).then(result => {
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
      expect(result).toMatchConfig()
      result.bundles.forEach((bundle, i) => expect(bundle).toMatchBundle(expected[bundle.id]))
      expect(Array.from(result.bundles[1].output)[0][1]).toMatchFile({
        source: {
          path: 'test/fixtures/simple.md'
        },
        content: Array.from(result.bundles[1].output)[0][1].source.content + '\n'
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
      expect(result).toMatchConfig()
      result.bundles.forEach((bundle, bundleIndex) => {
        expect(bundle).toMatchBundle(Object.assign({}, expected[bundleIndex].bundle, { success: true }))
        bundle.output.forEach((file, filepath) => expect(file).toMatchFile(expected[bundleIndex].output[filepath]))
      })
    })
  })

  test.skip('run complex example', () => {
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
      expect(result).toMatchConfig()
      result.bundles.forEach((bundle, bundleIndex) => {
        expect(bundle).toMatchBundle({ success: true })
        bundle.output.forEach((file) => {
          expect(file).toMatchFile()
          const expected = fs.readFileSync(path.join('test/fixtures/expected/node', file.to || file.source.path), 'utf8')
          const actual = fs.readFileSync(path.join('.temp', file.to || file.source.path), 'utf8')
          expect(actual.trim()).toBe(expected.trim())
        })
      })
    })
  })

  test.skip('run complex example with different data', () => {
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
      expect(result).toMatchConfig()
      result.bundles.forEach((bundle, bundleIndex) => {
        expect(bundle).toMatchBundle({ success: true })
        bundle.output.forEach((file) => {
          expect(file).toMatchFile()
          const expected = fs.readFileSync(path.join('test/fixtures/expected/browser', file.to || file.source.path), 'utf8')
          const actual = fs.readFileSync(path.join('.temp', file.to || file.source.path), 'utf8')
          expect(actual.trim()).toBe(expected.trim())
        })
      })
    })
  })

  if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    test('run with a github repo as source input', () => {
      expect.assertions(3)
      return Bundles.run({ bundles: [{
        input: [
          `https://github.com/thezimmee/test.git`,
          `gh:brikcss/boot-test`
        ],
        bundlers: [bundle => bundle]
      }] }).then(result => {
        expect(result).toMatchConfig()
        expect(result.bundles.length).toBe(1)
        expect(result.bundles[0]).toMatchBundle({
          success: true,
          input: [
            '.repos/thezimmee/test/README.md',
            '.repos/brikcss/boot-test/README.md',
            '.repos/brikcss/boot-test/TODO.md.xjs',
            '.repos/brikcss/boot-test/package.xjson'
          ]
        })
      })
    })
  }
})

function appendText (bundle = {}, bundler = {}) {
  bundle.output.forEach(file => {
    file.content += bundler.text || '\n\nI have been appended.'
  })
  return bundle
}
