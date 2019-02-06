/*! bundle.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and environment setup.
//

const log = require('loglevel')
const merge = require('@brikcss/merge')
const path = require('path')
const result = require('./result')
const Bundles = require('./bundles')
const Bundler = require('./bundler')
const File = require('./file')
const _ = require('./utilities')

// Cache next id for bundles that don't have an ID already.
let nextId = 0

// -------------------------------------------------------------------------------------------------
// Bundler constructor and prototype.
//

/**
 * Bundle prototype.
 * @type {Object}
 */
Bundle.prototype = {
  /**
   * Run a single bundle.
   * @return {Object}  Compiled bundle.
   */
  run () {
    const bundle = this
    // Do not run it if it's invalid.
    if (!bundle._meta.valid) {
      bundle.success = false
      return bundle
    }

    // Log it.
    log.info(`Bundling [${bundle.id}]...`)
    // Reduce bundlers to a series of promises that run in order.
    return bundle.bundlers.reduce((promise, bundler, i) => {
      return promise.then((bundle) => {
        return bundler.run(bundle, bundler)
      // If bundler completes successfully, mark as success.
      }).then(bundle => {
        bundler.success = true
        return bundle
      // If bundler errors out, mark as such and push the error.
      }).catch(error => {
        bundler.success = false
        result.errors.push(error)
        return bundle
      })
    // A bundle is marked as successful if all bundlers successfully complete.
    }, Promise.resolve(bundle)).then(bundle => {
      bundle.success = bundle.bundlers.every(bundler => bundler.success)
      return result.config.watch ? bundle.watch(result.config.watch) : bundle
    // If a bundle errors out, mark it and push error.
    }).catch(error => {
      bundle.success = false
      result.errors.push(error)
      return bundle
    })
  },
  /**
   * Watch bundle and recompile when source input changes.
   * @return {Object} Compiled bundle.
   */
  watch (bundlesToWatch) {
    const bundle = this

    // Only watch if it's configured to be watched.
    if (!bundlesToWatch || (bundlesToWatch instanceof Array && !bundlesToWatch.includes(bundle.id))) {
      bundle._meta.watching = false
      return bundle
    }

    // Return a promise.
    const chokidar = require('chokidar')
    return new Promise((resolve, reject) => {
      bundle.watcher = chokidar.watch(bundle.input, bundle.options.chokidar)
      bundle.watcher
        .on('change', (filepath) => {
          // Don't run if watcher is not ready yet.
          if (!bundle._meta.watching) return
          // Log the file change.
          log.info(`File changed: ${path.relative(process.cwd(), filepath)}`)
          // Clear previous errors.
          result.errors = []
          // Read in changed source file.
          bundle.outputMap[filepath] = Object.assign(
            bundle.outputMap[filepath],
            new File(filepath, { options: bundle.options })
          )
          // Run bundle.
          return Bundles.run(bundle, true)
        })
        .on('error', reject)
        .on('ready', () => {
          bundle._meta.watching = true
          resolve(bundle)
        })

      // Add config file to watcher.
      if (bundle._meta.configFile) bundle.watcher.add(bundle._meta.configFile)

      // Resolve with the bundle.
      return resolve(bundle)
    })
  }
}

/**
 * Bundle constructor.
 * @param {Object} bundle Bundle instance.
 */
function Bundle (bundle = {}) {
  //
  // Normalize bundle.
  // ------------------------------
  // First make sure bundle is an Object.
  if (!_.isObject(bundle)) return { input: bundle, _meta: { valid: false } }
  // Merge bundle with defaults.
  bundle = merge([{
    id: bundle.id || nextId++,
    success: false,
    input: [],
    output: [],
    bundlers: [],
    options: {},
    data: this.data,
    watcher: false,
    on: {},
    _meta: {
      valid: false,
      watching: false,
      configFile: undefined
    }
  }, bundle], { arrayStrategy: 'overwrite' })
  // Convert input to an Array.
  if (typeof bundle.input === 'string' || _.isObject(bundle.input)) {
    bundle.input = [bundle.input]
  }
  // If input still isn't an Array, return it as invalid.
  if (!(bundle.input instanceof Array)) return bundle

  //
  // Resolve input and output files.
  // -------------------------------
  File.setGlobals(bundle.data)
  const files = resolveFiles(bundle.input)
  bundle.input = files.input
  bundle.output = files.output
  bundle.outputMap = files.outputMap

  //
  // Create bundlers.
  // ----------------
  bundle.bundlers = bundle.bundlers.map(bundler => {
    bundler = new Bundler(bundler)
    return bundler
  })

  //
  // Check if bundle is valid.
  // -------------------------
  // A valid bundle is:
  //  - output is a non-empty [].
  //  - bundlers is a non-empty [] with at least one valid bundler.
  // -------------------------
  bundle._meta.valid = bundle.output instanceof Array &&
    bundle.output.length > 0 &&
    bundle.bundlers instanceof Array &&
    bundle.bundlers.length > 0 &&
    bundle.bundlers.some(bundler => bundler._meta.valid)

  //
  // Create public API.
  // ------------------
  bundle.run = this.run
  bundle.watch = this.watch

  //
  // Return the newly created bundle.
  // --------------------------------
  return bundle
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Set default props for new Bundles.
 * @param {Object}  options  Global options.
 * @param {Object}  data  Global data.
 * @param {Boolean} merge  Whether to merge with existing props.
 */
function setDefaults ({ options = {}, data = {} } = {}, merge = false) {
  const proto = Bundle.prototype
  proto.options = proto.options && merge ? merge(proto.options, options) : options
  proto.data = proto.data && merge ? merge(proto.data, data) : data
  return proto
}

/**
 * Resolve Files from an input Array.
 * @param  {Array}  input Array of paths or Objects to resolve.
 * @return {Object}       Result = { input, output, outputMap }
 */
function resolveFiles (input = []) {
  // Create initial result Object.
  let result = {
    input: [],
    output: [],
    outputMap: {}
  }
  // Make sure input is an Array.
  if (!(input instanceof Array)) input = [input]
  // Iterate through the input files and resolve all input/output files.
  return input.reduce((result, srcFile, i) => {
    const files = File.create(srcFile)
    result.output.push(...files)
    files.forEach((file, i) => {
      const src = file.source.path
      result.input.push(src)
      if (!result.outputMap[src]) result.outputMap[src] = result.output[i]
    })
    return result
  }, result)
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

Bundle.setDefaults = setDefaults

module.exports = Bundle
