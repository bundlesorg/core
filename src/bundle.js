/*! bundle.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and environment setup.
//

import log from 'loglevel'
import merge from '@brikcss/merge'
import path from 'path'
import micromatch from 'micromatch'
import Bundler from './bundler.js'
import File from './file.js'
import { watchBundle } from './watch.js'
import _ from './utilities'

// Cache cwd.
const cwd = process.cwd()
// Cache next id for bundles that don't have an ID already.
let nextId = 0
// fileTypeMap is used by the logger to log file types to the console.
const fileTypeMap = {
  input: 'File',
  dependencies: 'Dependency',
  bundlers: 'Bundler',
  data: 'Data file'
}

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
   * Check the source file type of a given filepath.
   *
   * @param {String} filepath  Source file path.
   * @return {String}  Type: 'input', 'dependencies', or 'data'.
   */
  getFileType (filepath) {
    return ['input', 'dependencies', 'bundlers'].find(type => {
      return micromatch.isMatch(filepath, this.sources[type])
    })
  },
  /**
   * Get all original input source paths.
   *
   * @return {Array}  All original source paths, including from input, data, and dependency sources.
   */
  getSources () {
    return ['input', 'dependencies', 'bundlers'].reduce((result, key) => result.concat(this.sources[key]), [])
  },
  /**
   * Create bundlers from given bundlers configuration.
   *
   * @param {Object|[Object]} bundlers  Bundlers configuration.
   * @return {Array}  Array of resolved bundlers.
   */
  resolveBundlers (bundlers) {
    if (_.trueType(bundlers) !== 'array') bundlers = [bundlers]
    return bundlers.map(bundler => new Bundler(bundler))
  },

  /**
   * Run a single bundle.
   *
   * @return {Object}  Compiled bundle.
   */
  run ({ start = new Date(), bundlers } = {}) {
    const bundle = this
    bundlers = _.trueType(bundlers) === 'array' ? bundlers : bundle.bundlers

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

    // Reduce bundlers to a series of promises that run in order.
    return bundlers.reduce((promise, bundler, i) => {
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
      bundle.success = bundlers.every(bundler => bundler.success)
      if (bundle.success) {
        bundle.changed.clear()
        bundle.removed.clear()
      }
      log.info(`${bundle.watching ? 'Rebundled' : 'Bundled'} [${bundle.id}] (${_.getTimeDiff(start)})`)
      return bundle.watch()
    // If a bundle errors out, mark it and log error.
    }).catch(error => {
      bundle.success = false
      log.error(`Error on [${bundle.id}]...`, error)
      return bundle
    })
  },

  /**
   * Mark given file path(s) as changed so they can be incrementally rebundled.
   *
   * @param {Array} filepaths  File path(s) to mark as changed.
   * @param {String} [options.type]  File type. Will be auto-detected if not provided.
   * @param {Boolean} [options.rebundle=true]  Whether to trigger a rebundle.
   * @return {Promise}  Promise to return bundle.
   */
  update (filepaths, { type, rebundle = true } = {}) {
    return _prepForRebundle.call(this, filepaths, { event: 'update', type, rebundle })
  },

  /**
   * Add one or more files to the bundle.
   *
   * @param {String|String[]} filepaths  Files to add.
   * @param {boolean} [rebundle=true]  Whether to rebundle after removing.
   * @return {Promise}  Promise to return the bundle.
   */
  add (filepaths, { type, rebundle = true } = {}) {
    return _prepForRebundle.call(this, filepaths, { event: 'add', type, rebundle })
  },

  /**
   * Remove one or more files from the bundle.
   *
   * @param {String|String[]} filepaths  Files to remove.
   * @param {Boolean} [rebundle=true]  Whether to rebundle after removing.
   * @return {Promise}  Promise to return the bundle.
   */
  remove (filepaths, { type, rebundle = true } = {}) {
    return _prepForRebundle.call(this, filepaths, { event: 'remove', type, rebundle })
  },

  /**
   * Watch bundle and recompile when source input changes.
   *
   * @return {Promise}  Promise for compiled bundle.
   */
  watch: watchBundle
}

/**
 * Bundle constructor.
 *
 * @param {Object} config  Bundle configuration.
 * @param {Object} globals  Bundles global configuration.
 */
function Bundle ({ id, input, bundlers, options, data, on } = {}, globals = {}) {
  const bundle = this
  //
  // Set defaults.
  // -------------

  // Ensure bundle has a unique id.
  bundle.id = typeof id === 'number'
    ? id.toString()
    : typeof id === 'string'
      ? id
      : (nextId++).toString()

  // Source input file paths.
  // @todo Convert to a Map: [original input, expanded paths or object(s)].
  bundle.input = new Map()

  // Bundler plugins.
  // @todo Convert to a Map: [module path, bundler object]
  bundle.bundlers = bundlers || []

  // Flags to track bundle's state.
  bundle.valid = false
  bundle.success = false
  bundle.watching = false

  // Changes files to track which files have changed since last run.
  bundle.changed = new Map()
  // Files which have been deleted since last run.
  bundle.removed = new Map()
  // File objects which contain all data necessary for outputting file data.
  bundle.output = new Map()
  // Create initial sources object, which contains all source files to be watched.
  bundle.sources = {}

  // Create space for a file watcher.
  bundle.watcher = null

  // Merge default options with global options.
  bundle.options = merge([
    {
      run: true,
      cwd: process.cwd(),
      watch: false,
      watchFiles: [],
      loglevel: 'info',
      glob: {},
      frontMatter: {},
      chokidar: {}
    },
    globals.options || {},
    options || {}],
  { arrayStrategy: 'overwrite' }
  )
  // Use options.cwd on options.glob.cwd.
  if (bundle.options && bundle.options.glob && !bundle.options.glob.cwd) bundle.options.glob.cwd = bundle.options.cwd

  // Merge global data with bundle data.
  if (!data || (!_.isObject(data) && typeof data !== 'function')) data = {}
  if (!globals.data || (!_.isObject(globals.data) && typeof globals.data !== 'function')) globals.data = {}
  if (typeof data === 'function' || typeof globals.data === 'function') {
    bundle.data = (file) => {
      return merge([
        {},
        typeof globals.data === 'function' ? globals.data(file) : globals.data,
        typeof data === 'function' ? data(file) : data
      ], { arrayStrategy: 'overwrite' })
    }
  } else {
    bundle.data = merge([{}, globals.data, data], { arrayStrategy: 'overwrite' })
  }

  // Merge the 'on' callback hooks.
  bundle.on = Object.assign(on || {}, globals.on || {})

  //
  // Resolve input and output files.
  // -------------------------------

  // Convert input to an Array.
  if (typeof input === 'string' || _.isObject(input)) input = [input]
  if (_.trueType(input) !== 'array') {
    this.input = input
    return
  }

  // Create input and output Maps from original source input.
  input.forEach((source, i) => {
    const files = File.create(source, bundle)
    const sourcePaths = []
    files.forEach(file => {
      const filepath = path.relative(cwd, path.join(bundle.options.cwd, file.source.path))
      sourcePaths.push(filepath)
      bundle.output.set(filepath, file)
    })
    bundle.input.set(source, sourcePaths)
  })

  //
  // Create bundlers.
  // ----------------
  bundle.bundlers = bundle.bundlers.map(bundler => new Bundler(bundler))

  //
  // Cache original sources.
  // -----------------------
  // Cache config file and its children data files.
  bundle.configFile = globals.configFile || ''
  // Source file paths, grouped by their use. This is used for watching files and, when a file
  // changes, checking what type of source file it is.
  bundle.sources = {
    // input: source input. Triggers incremental rebundle.
    input: Array.from(bundle.input.keys()),
    // dependencies: Triggers full rebundle. Comes from options.watchFiles.
    dependencies: bundle.options.watchFiles || [],
    // bundlers: Bundler modules and their children. Triggers an update to the changed bundler and a
    // bundle.run(). Comes from bundler.dataFiles.
    bundlers: bundle.bundlers.reduce((result, bundler) => result.concat(bundler.dataFiles || []), []),
    // data: Triggers Bundles refresh -> bundle.run() for this bundle only. Comes from
    // options.dataFiles.
    // data: bundle.options.dataFiles || [],
    // globalData: Triggers Bundles -> bundle.run() for ALL bundles. Reference to Bundles.dataFiles.
    globalData: globals.dataFiles || []
  }

  //
  // Check if bundle is valid.
  // -------------------------
  // A valid bundle is:
  //  - output is a non-empty [].
  //  - bundlers is a non-empty [] with at least one valid bundler.
  // -------------------------
  bundle.valid = _.trueType(bundle.input) === 'map' &&
    _.trueType(bundle.output) === 'map' &&
    bundle.output.size > 0 &&
    bundle.bundlers instanceof Array &&
    bundle.bundlers.length > 0 &&
    bundle.bundlers.some(bundler => bundler.valid)
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Update changed files based on given filepaths.
 *
 * @param {String|String[]} [filepaths]  File paths to mark. Defaults to bundle.output.
 * @param {Boolean} [clear=false]  Whether to clear bundle.changed.
 * @param {Object} [bundle]=this  Bundle file paths belong to.
 * @return {Map}  bundle.changed files.
 */
function _updateChangedFiles (filepaths, clear = false, bundle = this) {
  if (clear) bundle.changed.clear()
  if (!filepaths) filepaths = Array.from(bundle.output.keys())
  else if (typeof filepaths === 'string') filepaths = [filepaths]
  filepaths.forEach((filepath, id) => {
    bundle.output.set(filepath, new File(filepath, bundle))
    if (!bundle.changed.has(filepath)) bundle.changed.set(filepath, bundle.output.get(filepath))
  })
  return bundle.changed
}

/**
 * Given one or more file paths, determine the source type of each file prepare the bundle to be rebundled.
 *
 * @param {Array} filepaths  File paths that have changed.
 * @param {String} [options.event='change']  Type of event: 'change', 'add', or 'remove'.
 * @param {String} [options.type]  Explicity set the source type for all files.
 * @param {Object} [options.bundle]  The bundle. Defaults to this.
 * @param {boolean} [options.rebundle=true]  Whether to trigger a rebundle.
 * @return {Promise}  Promise to return the bundle.
 */
function _prepForRebundle (filepaths, { event = 'change', type, bundle, rebundle = true }) {
  const start = new Date()
  let markAll = false
  bundle = bundle || this

  // Ensure filepaths is an array.
  if (_.trueType(filepaths) !== 'array') filepaths = [filepaths]

  // Iterate through filepaths...
  filepaths.forEach(filepath => {
    // Get file type.
    if (!type) type = bundle.getFileType(filepath)

    // Log the file change.
    log.info(`${fileTypeMap[type] || fileTypeMap.input} ${event}${event === 'add' ? 'ed' : 'd'}: ${path.relative(cwd, filepath)}`)

    // Mark changed files for rebundle...
    // For input source files, do an incremental rebundle.
    if (type === 'input') {
      if (event === 'add') {
        bundle.output.set(filepath, new File(filepath, bundle))
      } else if (event === 'remove') {
        bundle.removed.set(filepath, bundle.output.get(filepath))
        bundle.output.delete(filepath, new File(filepath, bundle))
        bundle.changed.delete(filepath, bundle.output.get(filepath))
      }
      if (event !== 'remove') _updateChangedFiles.call(bundle, filepath)
    // For source dependencies, do a full rebundle.
    } else if (type === 'dependencies' || !type) {
      markAll = true
    // For bundler files, refresh the config and do a full rebundle.
    } else if (type === 'bundlers' && !bundle.sources.globalData.includes(filepath)) {
      let bundler = bundle.bundlers.find(b => b.id === filepath)
      if (bundler) {
        markAll = true
        _.flushRequireCache(bundler.dataFiles)
        bundler.run = require(filepath)
        bundler.testing = 123
      }
    }
  })

  // Mark files.
  if (markAll) _updateChangedFiles.call(bundle)

  // Run bundle.
  return rebundle ? bundle.run({ start }) : Promise.resolve(bundle)
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundle
