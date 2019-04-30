/* eslint-env jest */
import Bundles from '../src/bundles.js'
import { isValidOptions, isValidConfig, isValidBundle } from './validations.js'

afterEach(() => {
  Bundles.reset()
})

describe('Bundles global configurations', () => {
  test('auto detect config file', () => {
    expect.assertions(6)
    const config = Bundles.create()
    isValidConfig(config)
    matchesRootConfig(config)
  })

  test('create from config file Object', () => {
    expect.assertions(6)
    const config = Bundles.create('./.bundlesrc.js')
    isValidConfig(config)
    matchesRootConfig(config)
  })

  test('create from config file Object dictionary', () => {
    expect.assertions(3)
    const config = Bundles.create('test/fixtures/configs/.bundlesrc-dictionary.js')
    isValidConfig(config)
    const expectedConfigs = [{
      id: 'bundle1',
      input: ['test/fixtures/simple.md']
    }, {
      id: 'bundle2',
      input: ['test/fixtures/simple.md']
    }]
    config.bundles.forEach((bundle, i) => isValidBundle(bundle, expectedConfigs[i]))
  })

  test('create from config file Array', () => {
    expect.assertions(3)
    const config = Bundles.create('test/fixtures/configs/.bundlesrc-array.js')
    isValidConfig(config)
    const expectedConfigs = [{
      id: 'bundle1',
      input: ['test/fixtures/simple.md']
    }, {
      id: 'bundle2',
      input: ['test/fixtures/simple.md']
    }]
    config.bundles.forEach((bundle, i) => isValidBundle(bundle, expectedConfigs[i]))
  })

  test('throw error if config file doesn\'t exist', () => {
    expect.assertions(1)
    expect(() => Bundles.create('./.bundlesrc-nope.js')).toThrow(/Config file not found./)
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
    isValidConfig(config, { options: { loglevel: 'error' }, data: { testing: 123 } })
    config.bundles.forEach(bundle => isValidBundle(bundle, { id: '0' }))
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
    isValidConfig(config)
    expect(config.options.watch).toBe(false)
    expect(config.data).toEqual({})
    config.bundles.forEach(bundle => isValidBundle(bundle, { id: 'bundle' }))
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
    isValidConfig(config)
    expect(config.options.watch).toBe(false)
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
    config.bundles.forEach((bundle, i) => isValidBundle(bundle, expectedConfigs[i]))
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
    isValidConfig(config)
    expect(config.options.watch).toBe(false)
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
    config.bundles.forEach((bundle, i) => isValidBundle(bundle, expectedConfigs[i]))
  })
})

function matchesRootConfig (config) {
  isValidConfig(config)
  expect(config.bundles.length).toBe(1)
  isValidBundle(config.bundles[0])
  isValidOptions(config.options)
  expect(config.data).toEqual({})
}
