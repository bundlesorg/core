/*! bundle.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and environment setup.
//

import glob from 'globby'
import log from 'loglevel'
import merge from '@brikcss/merge'
import path from 'path'
import chokidar from 'chokidar'
import Bundler from './bundler.js'
import File from './file.js'
import _ from './utilities.js'

// Cache cwd.
const cwd = process.cwd()
// Cache next id for bundles that don't have an ID already.
let nextId = 0

// -------------------------------------------------------------------------------------------------
// Bundler constructor and prototype.
//

Bundle.prototype = {
  /**
   * Whether a bundle is configured to be run.
   *
   * @return  {Boolean}  Whether Bundle ID should be run.
   */
  shouldRun () {
    return _.idExistsInValue(this.options.run, this.id)
  },
  /**
   * Whether a bundle is configured to be watched.
   *
   * @return  {Boolean}  Whether Bundle ID should be watched.
   */
  shouldWatch () {
    return _.idExistsInValue(this.options.watch, this.id)
  },

  /**
   * Run a single bundle.
   *
   * @param {Boolean} ?isTest=false? Will terminate when true.
   * @return {Object}  Compiled bundle.
   */
  run (isTest = false) {
    const bundle = this

    // Do not run it if it's invalid.
    if (!bundle.valid) {
      bundle.success = false
      return Promise.resolve(bundle)
    }

    // Only continue if configured to do so.
    if (!bundle.shouldRun()) {
      bundle.success = 'skipped'
      return Promise.resolve(bundle)
    }

    // Log it.
    if (!bundle.watching) log.info(`Bundling [${bundle.id}]...`)
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
        log.error(`Error on [${bundle.id}|${i}]...\n`, error)
        return bundle
      })
    // A bundle is marked as successful if all bundlers successfully complete.
    }, Promise.resolve(bundle)).then(bundle => {
      bundle.success = bundle.bundlers.every(bundler => bundler.success)
      return bundle.watch(isTest)
    // If a bundle errors out, mark it and log error.
    }).catch(error => {
      bundle.success = false
      log.error(`Error on [${bundle.id}]...`, error)
      return bundle
    })
  },

  /**
   * Watch bundle and recompile when source input changes.
   *
   * @param {Boolean} ?isTest=false? Will terminate when true.
   * @return {Object} Compiled bundle.
   */
  watch (isTest = false) {
    const bundle = this
    if (bundle.watching) return Promise.resolve(bundle)

    // Return a promise.
    return new Promise((resolve, reject) => {
      // Only watch if it's configured to be watched.
      if (!bundle.shouldWatch()) {
        bundle.watching = false
        return resolve(bundle)
      }

      bundle.watcher = chokidar.watch(bundle.input, bundle.options.chokidar)
      bundle.watcher
        .on('change', (filepath) => {
          const start = new Date()
          // Don't run if watcher is not ready yet.
          if (!bundle.watching) return
          // Log the file change.
          log.info(`File changed: ${path.relative(cwd, path.join(bundle.options.cwd, filepath))}`)
          // Read in changed source file, if it exists in the output dictionary.
          bundle.changed = []
          if (bundle.outputMap[filepath]) {
            bundle.outputMap[filepath] = new File(filepath, bundle)
            bundle.changed.push(bundle.outputMap[filepath])
          // If changed file exists in watchFiles, mark all output files as changed.
          } else if (bundle.options.watchFiles.length && bundle.options.watchFiles.includes(filepath)) {
            bundle.output.forEach((f, i) => {
              bundle.output[i] = new File(bundle.output[i].source.path, bundle)
              bundle.changed.push(bundle.output[i])
            })
          }
          // Run bundle.
          return bundle.run().then((result) => {
            log.info(`Rebundled [${bundle.id}] (${_.getTimeDiff(start)})`)
            return result
          })
        })
        .on('error', reject)
        .on('ready', () => {
          bundle.watching = true
          // Notify user.
          log.info(`Watching [${bundle.id}]...`)
        })

      // Watch config/data files.
      if (bundle.dataFiles) {
        bundle.watchDataFiles()
      }

      // Watch other files in options.watchFiles.
      if (bundle.options.watchFiles && bundle.options.watchFiles.length) {
        bundle.options.watchFiles = glob.sync(bundle.options.watchFiles, merge({}, bundle.options.glob, { ignore: (bundle.options.glob.ignore || []).concat(bundle.input) }))
        bundle.watcher.add(bundle.options.watchFiles)
      }

      // If this is a test, terminate this after the watcher is initialized.
      if (isTest) {
        return _.poll(() => bundle.watching, 5000, 200).then(() => {
          bundle.watcher.close()
          return resolve(bundle)
        })
      }
      return resolve(bundle)
    })
  }
}

/**
 * Bundle constructor.
 *
 * @param {Object} config  Bundle configuration.
 * @param {Object} globals  Bundles global configuration.
 */
function Bundle ({ id, input, bundlers, options, data } = {}, globals = {}) {
  //
  // Set defaults and normalize.
  // -------------
  // Set internal props.
  this.valid = false
  this.success = false
  this.watching = false
  this.watcher = null
  this.changed = []
  this.output = []

  // Set user configurable props.
  this.id = ((typeof id === 'number' || typeof id === 'string') ? id : nextId++).toString()
  this.input = input || []
  this.bundlers = bundlers || []
  this.options = merge([{
    run: true,
    cwd: cwd,
    watch: false,
    loglevel: 'info',
    glob: {
      dot: true
    },
    frontMatter: {},
    chokidar: {}
  }, globals.options || {}, options || {}], { arrayStrategy: 'overwrite' })
  this.data = merge([{}, globals.data || {}, data || {}], { arrayStrategy: 'overwrite' })

  // Convert input to an Array.
  if (typeof this.input === 'string' || _.isObject(this.input)) {
    this.input = [this.input]
  }
  // If input still isn't an Array, return it as invalid.
  if (!(this.input instanceof Array)) return
  // Use options.cwd on options.glob.cwd.
  if (this.options && this.options.glob && !this.options.glob.cwd) this.options.glob.cwd = this.options.cwd

  //
  // Resolve input and output files.
  // -------------------------------
  const files = resolveFiles(this.input, this)
  this.input = files.input
  this.output = files.output
  this.outputMap = files.outputMap

  //
  // Create bundlers.
  // ----------------
  this.bundlers = this.bundlers.map(bundler => new Bundler(bundler))

  //
  // Check if bundle is valid.
  // -------------------------
  // A valid bundle is:
  //  - output is a non-empty [].
  //  - bundlers is a non-empty [] with at least one valid bundler.
  // -------------------------
  this.valid = this.output instanceof Array &&
    this.output.length > 0 &&
    this.bundlers instanceof Array &&
    this.bundlers.length > 0 &&
    this.bundlers.some(bundler => bundler.valid)
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Resolve Files from an input Array.
 * @param  {Array}  input  Array of paths or Objects to resolve.
 * @param  {Object}  bundle  Bundle configuration.
 * @return {Object}       Result = { input, output, outputMap }
 */
function resolveFiles (input = [], bundle = {}) {
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
    const files = File.create(srcFile, bundle)
    files.forEach((file, i) => {
      const src = path.relative(cwd, path.join(bundle.options.cwd, file.source.path))
      result.output.push(file)
      result.input.push(src)
      if (!result.outputMap[file.source.path]) result.outputMap[file.source.path] = result.output[i]
    })
    return result
  }, result)
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundle
