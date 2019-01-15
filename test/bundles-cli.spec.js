/* eslint-env jest */
const rm = require('rimraf')
const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const cliPath = 'bin/bundles-cli.js'

jest.setTimeout(3000)

afterEach(() => {
  rm.sync('.temp')
})

test('run from command line', (done) => {
  expect.assertions(2)
  exec(`node ${cliPath} ./test/fixtures/configs/.cli-bundlesrc.js --bundles=bundle2`, (error, stdout, stderr) => {
    if (error) return error
    expect(fs.readFileSync('.temp/test/fixtures/simple.md', 'utf8')).toBe(fs.readFileSync('./test/fixtures/simple.md', 'utf8') + '\n')
    expect(fs.pathExistsSync('.temp/test/fixtures/bundlers/add-prop.js', 'utf8')).toBe(false)
    done()
  })
})

// test.skip('run with `--config=true` and `--cwd=<path>`', (done) => {
//   exec(`node ${cliPath} --config --cwd=./test/fixtures/configs`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/test.md', 'utf8')).toBe('I am content from .stakcssrc.js')
//     done()
//   })
// })

// test.skip('run a profile with `--config=<path>:<profiles>`.', (done) => {
//   exec(`node ${cliPath} --config=test/fixtures/configs/.stakcssrc-profiles.js:one`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/one.md', 'utf8')).toBe('I am content from .stakcssrc-profiles.js:one')
//     done()
//   })
// })

// test.skip('run multiple profiles with `--config=<path>:<profiles>`.', (done) => {
//   exec(`node ${cliPath} --config=test/fixtures/configs/.stakcssrc-profiles.js:one,two`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/one.md', 'utf8')).toBe('I am content from .stakcssrc-profiles.js:one')
//     expect(fs.readFileSync('.temp/two.md', 'utf8')).toBe('I am content from .stakcssrc-profiles.js:two')
//     done()
//   })
// })

// test.skip('run a config with NODE_ENV=development', (done) => {
//   exec(`NODE_ENV=development node ${cliPath} --config=test/fixtures/configs/.stakcssrc-envs.js:all`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/one.js', 'utf8')).toBe('I am content from .stakcssrc-envs.js:development')
//     done()
//   })
// })

// test.skip('run a config with NODE_ENV=production', (done) => {
//   exec(`NODE_ENV=production node ${cliPath} --config=test/fixtures/configs/.stakcssrc-envs.js:all`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/one.js', 'utf8')).toBe('I am content from .stakcssrc-envs.js:production')
//     expect(fs.readFileSync('.temp/one.min.js', 'utf8')).toBe('I am content from .stakcssrc-envs.js:production:minified')
//     done()
//   })
// })

// test.skip('run with bundlers option', (done) => {
//   exec(`node ${cliPath} --content="Testing, testing..." --bundlers="./test/fixtures/runners/sample2.js, ./test/fixtures/runners/sample3.js" --output=.temp/sample.js`, (error, stdout, stderr) => {
//     if (error) return error

//     expect(fs.readFileSync('.temp/sample.js', 'utf8')).toBe('Testing sample2.js\nTesting sample3.js')
//     done()
//   })
// })

// test.skip('bundle `source` from a glob and outputs separate files.', (done) => {
//   exec(`node ${cliPath} test/fixtures/sample1/**/* --output=.temp/ --bundlers=./test/fixtures/runners/concat.js`, (error, stdout, stderr) => {
//     if (error) {
//       return error
//     }

//     ['sample.md', 'sample.js'].forEach((filepath) => {
//       expect(fs.readFileSync(path.join('.temp/', filepath), 'utf8')).toBe(fs.readFileSync(path.join('test/fixtures/sample1', filepath), 'utf8'))
//     })
//     done()
//   })
// })

// test.skip('output separate files and renames with [name] and [ext].', (done) => {
//   exec(`node ${cliPath} test/fixtures/sample1/**/* --output=.temp/test-[name].[ext] --bundlers=./test/fixtures/runners/concat.js`, (error, stdout, stderr) => {
//     if (error) {
//       return error
//     }

//     ['sample.md', 'sample.js'].forEach((filepath) => {
//       expect(fs.readFileSync(path.join('.temp/', 'test-' + filepath), 'utf8')).toBe(fs.readFileSync(path.join('test/fixtures/sample1', filepath), 'utf8'))
//     })
//     done()
//   })
// })
