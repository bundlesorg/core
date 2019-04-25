/* eslint-env jest */
import File from '../src/file.js'
import fs from 'fs-extra'
const bundlesSource = fs.readFileSync('src/bundles.js', 'utf8')

afterEach(() => {
  File.setGlobals({})
  fs.removeSync('.temp')
})

test('create text file from input', () => {
  expect.assertions(1)
  const result = new File('src/bundles.js')
  expect(result).toMatchObject({
    source: {
      data: {},
      content: bundlesSource,
      excerpt: '',
      isEmpty: false
    },
    content: bundlesSource,
    data: {},
    isBuffer: false,
    encoding: 'utf8'
  })
})

test('create text file which inherits data', () => {
  expect.assertions(1)
  File.setGlobals({ one: 1 })
  const result = new File('src/bundles.js')
  expect(result).toMatchObject({
    source: {
      data: {},
      content: bundlesSource,
      excerpt: '',
      isEmpty: false
    },
    content: bundlesSource,
    data: {
      one: 1
    },
    isBuffer: false,
    encoding: 'utf8'
  })
})

test('create mixture of binary and text files', () => {
  expect.assertions(9)
  const files = File.create('test/fixtures/assets/')
  expect(files.length).toBe(8)
  files.forEach(file => {
    const outputPath = file.source.path.replace('test/fixtures/assets', '.temp')
    fs.outputFileSync(outputPath, file.content)
    if (file.isBuffer) {
      expect(Buffer.compare(fs.readFileSync(outputPath), file.content)).toBe(0)
    } else {
      expect(fs.readFileSync(outputPath, 'utf8')).toBe(file.content)
    }
  })
})
