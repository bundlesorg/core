/* eslint-env jest */
const fs = require('fs-extra')
const bundle = require('../lib/bundles.js')
const log = require('loglevel')

// Set loglevel here so jest doesn't output anything.
log.setLevel('silent')

const simpleBundle = require('../.bundlesrc.js')

function createBundle (obj = {}) {
  return Object.assign({}, simpleBundle, obj)
}
function appendNewLineBundler (bundle = {}, bundler = {}) {
  return new Promise((resolve) => {
    bundle.output.forEach(result => {
      result.content = result.content += '\n'
      return result.content
    })
    return resolve(bundle)
  })
}
function addPropBundler (bundle = {}, bundler = {}) {
  if (bundler.prop && bundler.value) bundle[bundler.prop] = bundler.value
  return bundle
}

afterEach(() => {
  fs.removeSync('.repos')
})

test('fail if `bundles` is a String and config doesn\'t exist', () => {
  expect.assertions(1)
  return expect(bundle('file/that/doesnt/exist.js')).resolves.toThrow()
})

test('run single bundle with config Object', () => {
  expect.assertions(7)
  return bundle({ bundles: [{
    input: 'test/fixtures/simple.md',
    bundlers: [simpleBundle.bundlers[0], simpleBundle.bundlers[1]]
  }] }).then(result => {
    const resultBundle = result.bundles[0]
    expect(result.success).toBe(true)
    expect(result.bundles).toBeInstanceOf(Array)
    expect(result.bundles.length).toBe(1)
    expect(resultBundle.success).toBe(true)
    expect(resultBundle.bundlers).toBeInstanceOf(Array)
    expect(resultBundle.bundlers.every(bundler => bundler.success && !bundler.error)).toBe(true)
    expect(resultBundle).toMatchObject({
      success: true,
      input: ['test/fixtures/simple.md'],
      id: '0',
      testing: 'test',
      array: [1, 2]
    })
  })
})

test('run multiple bundles with config Object', () => {
  expect.assertions(7)
  return bundle({ bundles: [{
    input: 'test/fixtures/simple.md',
    id: 'bundle1',
    bundlers: [simpleBundle.bundlers[0], simpleBundle.bundlers[1]]
  }, {
    input: 'test/fixtures/simple.md',
    id: 'bundle2',
    bundlers: [appendNewLineBundler, { run: addPropBundler, prop: 'test', value: 'ing' }]
  }] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles.length).toBe(2)
    const resultOne = result.bundles[0]
    const resultTwo = result.bundles[1]
    expect(resultOne.bundlers.length).toBe(2)
    expect(resultOne).toMatchObject({
      success: true,
      testing: 'test',
      array: [1, 2]
    })
    expect(resultTwo.bundlers.length).toBe(2)
    expect(resultTwo.test).toBe('ing')
    expect(resultTwo.output[0].content).toBe(resultTwo.output[0].source.content + '\n')
  })
})

test('run single bundle with config file', () => {
  expect.assertions(7)
  return bundle('.bundlesrc.js').then(result => {
    const resultBundle = result.bundles[0]
    expect(result.success).toBe(true)
    expect(result.bundles).toBeInstanceOf(Array)
    expect(result.bundles.length).toBe(1)
    expect(resultBundle.success).toBe(true)
    expect(resultBundle.bundlers).toBeInstanceOf(Array)
    expect(resultBundle.bundlers.every(bundler => bundler.success && !bundler.error)).toBe(true)
    expect(resultBundle).toMatchObject({
      success: true,
      input: ['test/fixtures/simple.md'],
      id: '0',
      testing: 'test',
      array: [1, 2]
    })
  })
})

test('run multiple bundles with config file', () => {
  expect.assertions(7)
  return bundle('./test/fixtures/configs/.multi-bundlesrc.js').then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles.length).toBe(2)
    const resultOne = result.bundles[0]
    const resultTwo = result.bundles[1]
    expect(resultOne.bundlers.length).toBe(2)
    expect(resultOne).toMatchObject({
      success: true,
      testing: 'test',
      array: [1, 2]
    })
    expect(resultTwo.bundlers.length).toBe(2)
    expect(resultTwo.test).toBe('ing')
    expect(resultTwo.output[0].content).toBe(resultTwo.output[0].source.content + '\n')
  })
})

test('run with bundlers as a String (node modules)', () => {
  expect.assertions(6)
  return bundle({ bundles: [{
    input: ['test/fixtures/simple.md'],
    bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 123 }]
  }] }).then(result => {
    const bundle = result.bundles[0]
    expect(result.success).toBe(true)
    expect(result.bundles.length).toBe(1)
    expect(bundle.bundlers.length).toBe(2)
    expect(bundle).toMatchObject({
      success: true,
      test: 123
    })
    expect(bundle.output[0].source.path).toBe('test/fixtures/simple.md')
    expect(bundle.output[0].content).toBe(bundle.output[0].source.content + '\n')
  })
})

test('skip invalid bundles and bundlers', () => {
  expect.assertions(16)
  return bundle({ bundles: [{
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
  }] }).then(result => {
    const bundle1 = result.bundles[0]
    const bundle2 = result.bundles[1]
    const bundle3 = result.bundles[2]
    expect(result.success).toBe(false)
    expect(result.bundles.length).toBe(3)

    expect(bundle1.success).toBeTruthy()
    expect(bundle1.bundlers.length).toBe(2)
    expect(bundle1.bundlers[0]._meta.isValid).toBeFalsy()
    expect(bundle1.bundlers[1]._meta.isValid).toBeFalsy()

    expect(bundle2.success).toBe(false)
    expect(bundle2.bundlers.length).toBe(2)
    expect(bundle2.bundlers[0]._meta.isValid).toBeFalsy()
    expect(bundle2.bundlers[1]._meta.isValid).toBeTruthy()
    expect(bundle2).toMatchObject({
      test: 123
    })

    expect(bundle3.success).toBe(false)
    expect(bundle3.bundlers.length).toBe(2)
    expect(bundle3.bundlers[0]._meta.isValid).toBeTruthy()
    expect(bundle3.bundlers[1]._meta.isValid).toBeFalsy()
    expect(bundle3.output[0].content).toBe(bundle3.output[0].source.content + '\n')
  })
})

test('run only specified bundles', () => {
  expect.assertions(14)
  const config = [createBundle({
    id: 'one',
    bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 1 }]
  }), createBundle({
    id: 'two',
    bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 12 }]
  }), createBundle({
    id: 'three',
    bundlers: ['./test/fixtures/bundlers/append-new-line.js', { run: './test/fixtures/bundlers/add-prop.js', prop: 'test', value: 123 }]
  })]
  return bundle({ bundles: config }, { bundles: ['two'] }).then(result => {
    expect(result.success).toBe(true)
    expect(result.bundles.length).toBe(3)

    expect(result.bundles[0].id).toBe('one')
    expect(result.bundles[1].id).toBe('two')
    expect(result.bundles[2].id).toBe('three')

    expect(result.bundlesMap.one.success).toBe('skipped')
    expect(result.bundlesMap.two.success).toBe(true)
    expect(result.bundlesMap.three.success).toBe('skipped')

    expect(result.bundlesMap.one.test).toBe(undefined)
    expect(result.bundlesMap.three.test).toBe(undefined)

    expect(result.bundlesMap.two).toMatchObject({
      success: true,
      test: 12
    })
    expect(result.bundlesMap.two.output.length).toBe(1)
    expect(result.bundlesMap.two.output[0].source.path).toBe('test/fixtures/simple.md')
    expect(result.bundlesMap.two.output[0].content).toBe(result.bundles[0].output[0].source.content + '\n')
  })
})

// Only run this test if it's not the CI.
test('run and watch for changes', () => {
  expect.assertions(10)
  fs.outputFileSync('./.temp/temp.md', '# I have short life...\n\n...but it was good life.\n')
  fs.outputFileSync('./.temp/simple.md', '# I am simple...\n\n...but also complex.\n')
  return bundle({ bundles: [{
    id: 'one',
    input: ['./.temp/simple.md', './.temp/temp.md'],
    bundlers: [simpleBundle.bundlers[0], simpleBundle.bundlers[1]]
  }] }, { watch: true }).then(result => {
    // Check that all is well with initial build.
    const resultBundle = result.bundles[0]
    expect(result.success).toBe(true)
    expect(result.bundles).toBeInstanceOf(Array)
    expect(result.bundles.length).toBe(1)
    expect(resultBundle.success).toBe(true)
    expect(resultBundle.bundlers).toBeInstanceOf(Array)
    expect(resultBundle.bundlers.every(bundler => bundler.success && !bundler.error)).toBe(true)
    expect(resultBundle).toMatchObject({
      success: true,
      input: ['./.temp/simple.md', './.temp/temp.md'],
      id: 'one',
      testing: 'test',
      array: [1, 2]
    })
    // Make sure watcher exists.
    expect(Object.keys(result.watchers).length).toBe(1)
    expect(result.watchers.one).toMatchObject({
      id: 'one',
      _eventsCount: 3,
      closed: false,
      options: {}
    })
    result.watchers.one.unwatch()
    result.watchers.one.close()
    expect(result.watchers.one.closed).toBe(true)
    fs.removeSync('.temp')
  })
})

// Only run if $GH_TOKEN exists.
if (process.env.GH_TOKEN) {
  test('run with a github repo as the source input', () => {
    expect.assertions(3)
    return bundle({ bundles: [{
      input: [`https://${process.env.GH_TOKEN}@github.com/thezimmee/test.git`, `gh:${process.env.GH_TOKEN}@brikcss/boot-test`],
      bundlers: [bundle => bundle]
    }] }).then(result => {
      expect(result.success).toBe(true)
      expect(result.bundles.length).toBe(1)
      expect(result.bundles[0]).toMatchObject({
        success: true,
        input: expect.arrayContaining([
          '.repos/test/README.md',
          '.repos/boot-test/README.md'
        ])
      })
    })
  })
}

test('run with config file if no config provided by user', (done) => {
  return bundle().then(result => {
    expect(result.bundles.length).toBe(1)
    expect(result.bundles[0]).toMatchObject({
      success: true,
      input: ['test/fixtures/simple.md'],
      id: '0',
      testing: 'test',
      array: [1, 2]
    })
    done()
  })
})

test('run with global and local `data`', () => {
  expect.assertions(2)
  return bundle({ bundles: [{
    input: ['test/fixtures/simple.md'],
    data: {
      local: true,
      winner: 'local'
    },
    bundlers: [bundle => bundle]
  }, {
    input: ['test/fixtures/front-matter.md'],
    data: {
      local: true,
      winner: 'local'
    },
    bundlers: [bundle => bundle]
  }],
  data: {
    global: true,
    winner: 'global'
  } }).then(result => {
    expect(result.bundles[0].output[0].data).toMatchObject({
      local: true,
      global: true,
      winner: 'local'
    })
    expect(result.bundles[1].output[0].data).toMatchObject({
      local: true,
      global: true,
      matter: true,
      winner: 'local'
    })
  })
})

test('run with `input` as String and no `content`', () => {
  expect.assertions(2)
  return bundle({ bundles: [{
    input: 'test/fixtures/simple.md',
    bundlers: [bundle => bundle]
  }] }).then(result => {
    expect(result.bundles[0].output[0].content).toBe('# Simple Test\n\nThis is a test.\n')
    expect(result.bundles[0].output[0].source.path).toBe('test/fixtures/simple.md')
  })
})

test('run with `input` as String and `content`', () => {
  expect.assertions(2)
  const content = '# I am content\n\nSee me roar.\n'
  return bundle({ bundles: [{
    input: 'test.md',
    content,
    bundlers: [bundle => bundle]
  }] }).then(result => {
    expect(result.bundles[0].output[0].content).toBe(content)
    expect(result.bundles[0].output[0].source.path).toBe('test.md')
  })
})

test('run with `input` as Object', () => {
  expect.assertions(2)
  const content = '# I am content\n\nSee me roar.\n'
  return bundle({ bundles: [{
    input: {
      path: 'test.md',
      content
    },
    bundlers: [bundle => bundle]
  }] }).then(result => {
    expect(result.bundles[0].output[0].content).toBe(content)
    expect(result.bundles[0].output[0].source.path).toBe('test.md')
  })
})
