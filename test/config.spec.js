/* eslint-env jest */
import Bundles from '../src/bundles.js'
import path from 'path'
import './jest-extended.js'

afterEach(() => {
  Bundles.reset()
})

describe('Bundles global configurations', () => {
  test('auto detect config file', () => {
    expect.assertions(1)
    const config = Bundles.create()
    expect(config).toMatchConfig({ configFile: path.join(process.cwd(), '.bundlesrc.js'), data: {} })
  })

  test('create from config file Object', () => {
    expect.assertions(1)
    const config = Bundles.create('./.bundlesrc.js')
    expect(config).toMatchConfig({ configFile: path.join(process.cwd(), '.bundlesrc.js'), data: {} })
  })

  test('create from config file Object dictionary', () => {
    expect.assertions(3)
    const config = Bundles.create('test/fixtures/configs/.bundlesrc-dictionary.js')
    expect(config).toMatchConfig()
    const expectedConfigs = [{
      id: 'bundle1',
      input: ['test/fixtures/simple.md']
    }, {
      id: 'bundle2',
      input: ['test/fixtures/simple.md']
    }]
    config.bundles.forEach((bundle, i) => expect(bundle).toMatchBundle(expectedConfigs[i]))
  })

  test('create from config file Array', () => {
    expect.assertions(3)
    const config = Bundles.create('test/fixtures/configs/.bundlesrc-array.js')
    expect(config).toMatchConfig()
    const expectedConfigs = [{
      id: 'bundle1',
      input: ['test/fixtures/simple.md']
    }, {
      id: 'bundle2',
      input: ['test/fixtures/simple.md']
    }]
    config.bundles.forEach((bundle, i) => expect(bundle).toMatchBundle(expectedConfigs[i]))
  })

  test('throw error if config file doesn\'t exist', () => {
    expect.assertions(1)
    expect(() => Bundles.create('./.bundlesrc-nope.js')).toThrow(/ENOENT: no such file or directory/)
  })

  test('create config from a global config Object', () => {
    expect.assertions(2)
    const config = Bundles.create({
      bundles: '.bundlesrc.js',
      options: {
        loglevel: 'error'
      },
      data: {
        testing: 123
      }
    })
    expect(config).toMatchConfig({ options: { loglevel: 'error' }, data: { testing: 123 } })
    config.bundles.forEach(bundle => expect(bundle).toMatchBundle({ id: '0' }))
  })

  test('create config from a bundle Object', () => {
    expect.assertions(4)
    const config = Bundles.create({
      id: 'bundle',
      input: 'src/bundles.js',
      bundlers: [(bundle) => bundle],
      options: {
        watch: true
      },
      data: {
        regional: true
      }
    })
    expect(config).toMatchConfig()
    expect(config.options.watch).toBeFalsy()
    expect(config.data).toEqual({})
    config.bundles.forEach(bundle => expect(bundle).toMatchBundle({ id: 'bundle' }))
  })

  test('create config from a bundles Object dictionary', () => {
    expect.assertions(5)
    const config = Bundles.create({
      'one': {
        input: 'src/bundles.js',
        bundlers: [bundle => bundle],
        options: {
          watch: true
        },
        data: {
          one: true
        }
      },
      'two': {
        input: 'src/bundle.js',
        bundlers: [bundle => bundle],
        data: {
          one: false
        }
      }
    })
    expect(config).toMatchConfig()
    expect(config.options.watch).toBeFalsy()
    expect(config.data).toEqual({})
    const expectedConfigs = [{
      id: 'one',
      input: ['src/bundles.js'],
      options: {
        watch: true
      },
      data: {
        one: true
      }
    }, {
      id: 'two',
      input: ['src/bundle.js'],
      options: {
        watch: false
      },
      data: {
        one: false
      }
    }]
    config.bundles.forEach((bundle, i) => expect(bundle).toMatchBundle(expectedConfigs[i]))
  })

  test('create config from a bundles Array', () => {
    expect.assertions(5)
    const config = Bundles.create([{
      id: 'one',
      input: 'src/bundles.js',
      bundlers: [bundle => bundle],
      options: {
        watch: true
      },
      data: {
        one: true
      }
    }, {
      id: 'two',
      input: 'src/bundle.js',
      bundlers: [bundle => bundle],
      data: {
        one: false
      }
    }])
    expect(config).toMatchConfig()
    expect(config.options.watch).toBeFalsy()
    expect(config.data).toEqual({})
    const expectedConfigs = [{
      id: 'one',
      input: ['src/bundles.js'],
      options: {
        watch: true
      },
      data: {
        one: true
      }
    }, {
      id: 'two',
      input: ['src/bundle.js'],
      options: {
        watch: false
      },
      data: {
        one: false
      }
    }]
    config.bundles.forEach((bundle, i) => expect(bundle).toMatchBundle(expectedConfigs[i]))
  })

  test.skip('correctly parse watchFiles and dataFiles to Bundles and bundles', () => {})

  test.skip('auto add nested data files to bundler', () => {})
})
