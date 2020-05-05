/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import path from 'path'
import _ from './utilities'
import { createWatcher } from './watch.js'
import { parseConfig } from './config.js'
import Bundle from './bundle.js'

// -------------------------------------------------------------------------------------------------
// Bundles.
//

// Bundles API.
const Bundles = {
  // Run everything start to finish.
  run: _runAll,
  // Create/parse/normalize bundles from global configuration.
  create: _createConfig,
  // Run one or more bundles.
  bundle: _bundle,
  // Reset Bundles to a fresh state.
  reset: _resetBundles
}

// Initialize Bundles.
Bundles.reset()

// -------------------------------------------------------------------------------------------------
// Methods and helper functions.
//

/**
 * Run bundles from user configuration.
 *
 * @param {string} [config='']  User configuration.
 * @param {Object} [options={}]  Internal options.
 * @param {boolean} [options.isRebundle=false]  Indicates if this is a rebundle.
 * @param {Date} options.start  Task's runtime start Date.
 * @return {Object}  Bundles result.
 */
function _runAll (config = '', { isRebundle = false, start } = {}) {
  start = start || new Date()
  log.setDefaultLevel('info')
  log.info(`${isRebundle ? 'Refreshing' : 'Running'} Bundles...`)
  Bundles.userConfig = config
  return Bundles.create(config).bundle({ start })
}

/**
 * Run or rerun previously parsed/configured bundles.
 *
 * @param  {String|String[]} ?bundleIds  Bundle IDs to run. Can be comma-separated String or Array
 *     of Strings. If undefined or not a String or Array, will run all bundles.
 * @param {Date} ?start  Date/time the task started. Used to calculate the time it took to run.
 * @return {Promise}  Promise that resturns Bundles.
 */
function _bundle ({ bundleIds, start }) {
  start = start || new Date()
  bundleIds = _.convertStringToArray(bundleIds)
  // @todo Change `bundles` to be list of bundle IDs to run, and have this method filter bundles to
  //     run from Bundles.bundles.
  return Promise.all(Bundles.bundles.map(bundle => {
    if (bundleIds instanceof Array && !bundleIds.includes(bundle.id)) return bundle
    return bundle.run()
  })).then(() => {
    Bundles.success = Bundles.bundles.every(bundle => !!bundle.success)
    Bundles.watching = Bundles.bundles.some(bundle => bundle.watching)
    log.info((Bundles.success ? '[ok] Success!' : '[!!] Failed. Check errors.') + (start ? ` (${_.getTimeDiff(start)})` : ''))
    if (typeof Bundles.on.afterBundle === 'function') Bundles.on.afterBundle(Bundles)
    return Bundles
  }).catch(error => {
    log.error(error)
    return error
  })
}

/**
 * Watch config file and its children data files.
 *
 * @return  {Object}  Bundles.
 */
function _watchDataFiles () {
  if (Bundles.watchingData || !Bundles.dataFiles || !Bundles.dataFiles.length) return
  Bundles.watchingData = 'ready'
  Bundles.watcher = createWatcher(Bundles.dataFiles, Bundles.options.chokidar, {
    change: (filepath) => {
      const start = new Date()
      // Don't run if watcher is not ready yet.
      if (Bundles.watchingData !== true) return
      // Log the change.
      log.info(`Data file changed: ${path.relative('.', filepath)}`)
      // Remove cache of config data files.
      _.flushRequireCache(Bundles.dataFiles)
      // Refresh the data.
      return Bundles.run(Bundles.userConfig, { isRebundle: true, start })
    },
    error: (error) => log.error(error),
    ready: () => {
      Bundles.watchingData = true
      log.info('Watching config/data files...')
    }
  })
  return Bundles
}

/**
 * Initialize each bundle in an Array of bundle Objects.
 *
 * @param   {Array}  [bundles=[]]  Array of bundle Objects to initialize.
 * @return  {Array}  Initialized Array of bundles.
 */
function _createBundles (bundles = []) {
  // Close existing watchers.
  if (Bundles.bundles.length) {
    Bundles.bundles.forEach(bundle => {
      if (bundle.watcher) bundle.watcher.close()
    })
  }
  // Create new bundles from user configured bundles.
  return bundles.map((bundle, index) => {
    // The bundle must be an Object.
    if (!_.isObject(bundle)) {
      log.error(`Bundle [${index}] was not added, it must be an Object.`)
      return { input: bundle, valid: false }
    }
    // Create and return the new Bundle.
    bundle.id = bundle.id || index.toString()
    // Create the new bundle. If the bundle already exists in Bundles, refresh it and mark only the
    // files that have changed from their original source.
    bundle = new Bundle(bundle, Bundles)
    // Mark all files as changed.
    bundle.output.forEach(file => bundle.changed.set(file.source.input, file))
    // Cache config file and its children data files.
    bundle.configFile = Bundles.configFile
    if (Bundles.dataFiles) bundle.watchDataFiles = _watchDataFiles
    // Return the bundle.
    return bundle
  })
}

/**
 * Create a properly formed global configuration object from initial user configuration.
 *
 * @param  {Object}  [config]  User configuration.
 */
function _createConfig (config) {
  config = parseConfig(config)

  // Set default log level (may get overridden by other log.setLevel() method).
  log.setDefaultLevel(
    ['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(config.options.loglevel)
      ? config.options.loglevel
      : 'info'
  )

  // Assign config props to Bundles.
  Bundles.configFile = config.configFile || ''
  Bundles.dataFiles = config.dataFiles || []
  Bundles.options = config.options || {}
  Bundles.on = config.on || {}
  Bundles.data = config.data || {}
  Bundles.bundles = _createBundles(config.bundles)

  // Return Bundles.
  return Bundles
}

/**
 * Reset Bundles props to their initial state.
 */
function _resetBundles () {
  Bundles.userConfig = {}
  Bundles.success = false
  Bundles.watching = false
  Bundles.watchingData = false
  Bundles.watcher = null
  Bundles.configFile = ''
  Bundles.dataFiles = []
  // @todo Create bundles Map (in addition to bundles Array).
  Bundles.bundles = []
  // @todo Create files Map.
  // Bundles.files = Bundles.files instanceof Map ? Bundles.files.clear() : new Map()
  Bundles.options = {}
  Bundles.data = {}
  Bundles.on = {}
  return Bundles
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundles
