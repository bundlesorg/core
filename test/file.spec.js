/* eslint-env jest */
import fs from 'fs-extra'
import File from '../src/file.js'
import { isValidFile } from './validations.js'
const bundlesSource = fs.readFileSync('src/bundles.js', 'utf8')

afterEach(() => {
  fs.removeSync('.temp')
  fs.removeSync('.repos')
})

describe('File constructor', () => {
  test('create text file from input', () => {
    expect.assertions(1)
    isValidFile(new File('src/bundles.js'), {
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
})
