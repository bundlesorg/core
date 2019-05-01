/* eslint-env jest */
import merge from '@brikcss/merge'

function isValidOptions (options, expectedOptions = {}) {
  expectedOptions = merge([{
    run: expect.any(Boolean),
    watch: expect.any(Boolean),
    cwd: expect.any(String),
    loglevel: expect.any(String),
    chokidar: expect.any(Object),
    frontMatter: expect.any(Object),
    glob: expect.any(Object)
  }, expectedOptions], { arrayStrategy: 'overwrite' })
  expect(options).toMatchObject(expectedOptions)
}

function isValidBundle (bundle, expectedBundle = {}) {
  expectedBundle = merge([{
    valid: true,
    success: expect.any(Boolean),
    watching: expect.any(Boolean),
    watcher: expect.any(Object),
    input: expect.any(Array),
    changed: expect.any(Array),
    output: expect.any(Array),
    bundlers: expect.any(Array)
  }, expectedBundle], { arrayStrategy: 'overwrite' })
  expect(bundle).toMatchObject(expectedBundle)
}

function isSuccessfulBundle (bundle, expectedBundle = {}) {
  expectedBundle.success = true
  isValidBundle(bundle, expectedBundle)
}

function isValidBundler (bundler, expectedBundler = {}) {
  expectedBundler = merge([{
    valid: true,
    run: expect.any(Function)
  }, expectedBundler], { arrayStrategy: 'overwrite' })
  expect(bundler).toMatchObject(expectedBundler)
}

function isValidFile (file, expectedFile = {}) {
  expectedFile = merge([{
    source: {
      data: expect.any(Object),
      content: expect.any(String),
      path: expect.any(String),
      cwd: expect.any(String)
    },
    content: expect.any(String),
    data: expect.any(Object),
    encoding: 'utf8' || 'binary',
    isBuffer: expect.any(Boolean)
  }, expectedFile], { arrayStrategy: 'overwrite' })
  if (typeof file.content === 'string') file.content = file.content.trim()
  if (typeof expectedFile.content === 'string') expectedFile.content = expectedFile.content.trim()
  expect(file).toMatchObject(expectedFile)
}

function isValidResult (result, expectedResult = {}) {
  expectedResult = merge([{
    initialized: true,
    success: expect.any(Boolean),
    // watching: expect.any(Boolean),
    watchingDataFiles: expect.any(Boolean),
    watcher: expect.any(Object),
    configFile: expect.any(String),
    dataFiles: expect.any(Array),
    bundles: expect.any(Array),
    options: expect.any(Object),
    data: expect.any(Object)
  }, expectedResult], { arrayStrategy: 'overwrite' })
  expect(result).toMatchObject(expectedResult)
}

function isSuccessfulResult (result, expectedResult = {}) {
  expectedResult.success = true
  isValidResult(result, expectedResult)
}

export {
  isValidOptions,
  isValidBundle,
  isSuccessfulBundle,
  isValidBundler,
  isValidFile,
  isValidResult,
  isSuccessfulResult
}
