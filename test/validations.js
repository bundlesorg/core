/* eslint-env jest */
import merge from '@brikcss/merge'

function isValidOptions (options, expectedOptions = {}) {
  expectedOptions = merge([{
    chokidar: expect.any(Object),
    cwd: expect.any(String),
    frontMatter: expect.any(Object),
    glob: expect.any(Object),
    loglevel: expect.any(String),
    run: expect.any(Boolean),
    watch: expect.any(Boolean)
  }, expectedOptions], { arrayStrategy: 'overwrite' })
  expect(options).toMatchObject(expectedOptions)
}

function isValidConfig (config, expectedConfig = {}) {
  expectedConfig = merge([{
    initialized: true,
    success: expect.any(Boolean),
    watching: expect.any(Boolean),
    bundles: expect.any(Array),
    // files: expect.any(Map),
    options: expect.any(Object),
    data: expect.any(Object)
  }, expectedConfig], { arrayStrategy: 'overwrite' })
  expect(config).toMatchObject(expectedConfig)
}

function isValidBundle (bundle, expectedBundle = {}) {
  expectedBundle = merge([{
    valid: true,
    success: expect.any(Boolean),
    watching: expect.any(Boolean),
    // configFile: null || expect.any(String),
    dataFiles: expect.any(Array),
    input: expect.any(Array),
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
    // options: expect.any(Object),
    // bundle: expect.any(Object),
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
    watching: expect.any(Boolean),
    // configFile: null && expect.any(String),
    options: expect.any(Object),
    data: expect.any(Object),
    bundles: expect.any(Array)
  }, expectedResult], { arrayStrategy: 'overwrite' })
  expect(result).toMatchObject(expectedResult)
}

function isSuccessfulResult (result, expectedResult = {}) {
  expectedResult.success = true
  isValidResult(result, expectedResult)
}

export {
  isValidOptions,
  isValidConfig,
  isValidBundle,
  isSuccessfulBundle,
  isValidBundler,
  isValidFile,
  isValidResult,
  isSuccessfulResult
}
