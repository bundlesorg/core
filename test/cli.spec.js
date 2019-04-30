/* eslint-env jest */
import { spawn } from 'child_process'
import fs from 'fs-extra'
const cliPath = 'bin/bundles.js'

jest.setTimeout(3000)

afterEach(() => {
  fs.removeSync('.temp')
})

describe('Command Line Interface', () => {
  test('run with no options', (done) => {
    expect.assertions(1)
    const child = spawn('node', [cliPath])
    child.on('close', done)
    child.stdout.on('data', (data) => {
      if (data.includes('[ok] Success!')) {
        expect(true).toBe(true)
      // } else {
      //   console.log(data.toString())
      }
    })
    child.stderr.on('data', data => console.log('ERROR:', data.toString()))
  })

  test('run a configured bundle', (done) => {
    expect.assertions(1)
    const child = spawn(`node ${cliPath} test/fixtures/front-matter.md --bundlers='[{"run": "@bundles/bundles-output", "options": {"to": ".temp", "root": "test/fixtures"}}]'`, { shell: true, detached: true })
    child.on('close', () => {
      expect(fs.readFileSync('.temp/front-matter.md', 'utf8').trim()).toBe('# Simple Test\n\nThis is a test.')
      done()
    })
    child.on('message', console.log)
    // child.stdout.on('data', data => console.log(data.toString()))
    child.stderr.on('data', data => {
      console.log('ERROR:', data.toString())
    })
  })

  test('run with a config file', (done) => {
    expect.assertions(2)
    const child = spawn('node', [
      cliPath,
      '--config=test/fixtures/configs/.cli-bundlesrc.js',
      '--run=bundle2'
    ])
    child.on('close', () => {
      expect(fs.readFileSync('.temp/front-matter.md', 'utf8').trim()).toBe('# Simple Test\n\nThis is a test.')
      expect(fs.pathExistsSync('.temp/simple.md', 'utf8')).toBe(false)
      done()
    })
    // child.stdout.on('data', data => console.log(data.toString()))
    child.stderr.on('data', data => console.log('ERROR:', data.toString()))
  })
})
