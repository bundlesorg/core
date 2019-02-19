/*! bundle.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and environment setup.
//

import log from 'loglevel'
import merge from '@brikcss/merge'
import path from 'path'
import chokidar from 'chokidar'
import Bundler from './bundler.js'
import File from './file.js'
import _ from './utilities.js'

// Cache next id for bundles that don't have an ID already.
let nextId = 0
const defaults = {
  path: undefined,
  run: true,
  watch: false,
  loglevel: 'info',
  glob: {
    dot: true
  },
  frontMatter: {},
  chokidar: {}
}

// -------------------------------------------------------------------------------------------------
// Bundler constructor and prototype.
//

/**
 * Bundle prototype.
 * @type {Object}
 */
Bundle.prototype = {
  /**
   * Default options.
   * @type {Object}
   */
  defaults,
  /**
   * Options to be merged with each new Bundle.
   * @type {Object}
   */
  options: Object.assign({}, defaults),
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

    // Only continue if configured to do so.
    if (!shouldContinue(bundle.options.run, bundle.id)) {
      bundle.success = 'skipped'
      return Promise.resolve(bundle)
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
      // If bundler errors out, mark as such and log the error.
      }).catch(error => {
        bundler.success = false
        log.error(error)
        return bundle
      })
    // A bundle is marked as successful if all bundlers successfully complete.
    }, Promise.resolve(bundle)).then(bundle => {
      bundle.success = bundle.bundlers.every(bundler => bundler.success)
      return bundle.watch()
    // If a bundle errors out, mark it and log error.
    }).catch(error => {
      bundle.success = false
      log.error(error)
      return bundle
    })
  },
  /**
   * Watch bundle and recompile when source input changes.
   * @return {Object} Compiled bundle.
   */
  watch () {
    const bundle = this

    // Return a promise.
    return new Promise((resolve, reject) => {
      // Only watch if it's configured to be watched.
      if (!shouldContinue(bundle.options.watch, bundle.id)) {
        bundle._meta.watching = false
        return resolve(bundle)
      }

      bundle.watcher = chokidar.watch(bundle.input, bundle.options.chokidar)
      bundle.watcher
        .on('change', (filepath) => {
          // Don't run if watcher is not ready yet.
          if (!bundle._meta.watching) return
          // Log the file change.
          log.info(`File changed: ${path.relative(process.cwd(), filepath)}`)
          // Read in changed source file.
          bundle.outputMap[filepath] = Object.assign(
            bundle.outputMap[filepath],
            new File(filepath, { options: bundle.options })
          )
          // Run bundle.
          return bundle.run(bundle)
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
 * @param {Object} bundle  Bundle instance.
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
    data: {},
    watcher: false,
    on: {},
    _meta: {
      valid: false,
      watching: false,
      configFile: undefined
    }
  }, { options: this.options, data: this.data }, bundle], { arrayStrategy: 'overwrite' })
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

/**
 * Determine if a bundle should continue, provided a Boolean or Array of Bundle IDs.
 * @param  {Boolean|String[]|String}  value  Value to check for bundle.
 * @param  {String} bundleId  Bundle ID to check against.
 * @return {Boolean}  Whether bundle is included.
 */
function shouldContinue (value, bundleId) {
  if (typeof value === 'string') value = value.split(/,?\s+/)
  return !value || value === true || (value instanceof Array && value.includes(bundleId))
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundle
