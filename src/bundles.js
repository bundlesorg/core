/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import merge from '@brikcss/merge'
import path from 'path'
import chokidar from 'chokidar'
import _ from './utilities.js'
import { parseConfig } from './config.js'
import Bundle from './bundle.js'

// -------------------------------------------------------------------------------------------------
// Bundles.
//

// Bundles API.
const Bundles = {
  // Run everything start to finish.
  run: runAll,
  // Create/parse/normalize bundles from global configuration.
  create: createConfig,
  // Run one or more bundles.
  bundle: bundle,
  // Reset Bundles to a fresh state.
  reset: resetBundles
}

// Initialize Bundles.
Bundles.reset()

// -------------------------------------------------------------------------------------------------
// Methods and helper functions.
//

/**
 * Run bundles from user configuration.
 *
 * @param {string} [config='']  User configuration object.
 * @param {Object} [options={}]  Internal options.
 * @param {boolean} [options.isRebundle=false]  Indicates if this is a rebundle.
 * @param {Date} options.start  Task's runtime start Date.
 * @return {Object}  Bundles result.
 */
function runAll (config = '', { isRebundle = false, start } = {}) {
  start = start || new Date()
  log.setDefaultLevel('info')
  log.info(`${isRebundle ? 'Refreshing' : 'Running'} Bundles...`)
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
function bundle ({ bundleIds, start }) {
  start = start || new Date()
  bundleIds = _.convertStringToArray(bundleIds)
  // @todo Change `bundles` to be list of bundle IDs to run, and have this method filter bundles to
  //     run from Bundles.bundles.
  return Promise.all(Bundles.bundles.map(bundle => {
    if (bundleIds instanceof Array && !bundleIds.includes(bundle.id)) return bundle
    return bundle.run()
  })).then(() => {
    Bundles.success = Bundles.bundles.every(bundle => !!bundle.success)
    log.info((Bundles.success ? '[ok] Success!' : '[!!] Failed. Check errors.') + (start ? ` (${_.getTimeDiff(start)})` : ''))
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
function watchDataFiles () {
  if (Bundles.watchingDataFiles || !Bundles.dataFiles || !Bundles.dataFiles.length) return
  Bundles.watchingDataFiles = 'ready'
  Bundles.watcher = chokidar.watch(Bundles.dataFiles, Bundles.options.chokidar)
  Bundles.watcher.on('change', (filepath) => {
    const start = new Date()
    // Don't run if watcher is not ready yet.
    if (Bundles.watchingDataFiles !== true) return
    // Log the change.
    log.info(`Data file changed: ${path.relative(process.cwd(), filepath)}`)
    // Remove cache of config data files.
    Bundles.dataFiles.forEach(filepath => {
      delete require.cache[path.resolve(filepath)]
    })
    // Refresh the data.
    return Bundles.run({
      bundles: Bundles.configFile,
      options: Bundles.options,
      data: Bundles.data
    }, { isRebundle: true, start })
  })
    .on('error', log.error)
    .on('ready', () => {
      Bundles.watchingDataFiles = true
      log.info('Watching config/data files...')
    })
  return Bundles
}

/**
 * Refresh Bundles from global configuration. If Bundles already has existing options, data, and/or
 * bundles, the configuration will be merged with it, in which case certain bundle properties will
 * not be overridden (e.g., bundle.watch, etc.).
 *
 * @param   {Object}  [config={}]  Global configuration object.
 * @return  {Object}  Bundles.
 */
function refreshConfig (config = {}) {
  Bundles.data = merge([Bundles.data, config.data], { arrayStrategy: 'overwrite' })
  Bundles.options = merge([Bundles.options, config.options], { arrayStrategy: 'overwrite' })
  Bundles.configFile = config.configFile || ''
  Bundles.dataFiles = config.dataFiles || []

  if (_.isObject(config.bundles)) config.bundles = [config.bundles]
  // Create a new Bundle Object from each user configured bundle.
  if (!config.bundles || !(config.bundles instanceof Array)) return Bundles
  const newBundles = []
  config.bundles.forEach((bundle, index) => {
    // The bundle must be an Object.
    if (!_.isObject(bundle)) {
      log.error(`Bundle [${index}] was not added, it must be an Object.`)
      return { input: bundle, valid: false }
    }
    // Create and return the new Bundle.
    bundle.id = bundle.id || index.toString()
    // If the bundle already exists in Bundles, refresh it.
    let existingBundle = Bundles.bundles.find(b => b.id === bundle.id)
    bundle = new Bundle(bundle, Bundles)
    if (existingBundle) {
      bundle = merge([bundle, {
        valid: existingBundle.valid,
        success: existingBundle.success,
        watching: existingBundle.watching,
        watcher: existingBundle.watcher
      }], { arrayStrategy: 'overwrite' })
    }
    // Cache config file and its children data files.
    bundle.configFile = Bundles.configFile
    if (Bundles.dataFiles) {
      bundle.dataFiles = Bundles.dataFiles
      bundle.watchDataFiles = watchDataFiles
    }
    // Add bundle to Bundles.
    newBundles.push(bundle)
  })
  Bundles.bundles = newBundles

  return Bundles
}

/**
 * Create a properly formed global configuration object from initial user configuration.
 *
 * @param  {Object}  [config]  User configuration.
 */
function createConfig (config) {
  config = parseConfig(config)

  // Set default log level (may get overridden by other log.setLevel() method).
  log.setDefaultLevel(
    ['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(config.options.loglevel)
      ? config.options.loglevel
      : 'info'
  )

  // Refresh Bundles and return it.
  refreshConfig(config)
  return Bundles
}

/**
 * Reset Bundles props to their initial state.
 */
function resetBundles () {
  Bundles.initialized = true
  Bundles.success = false
  // Bundles.watching = false
  Bundles.watchingDataFiles = false
  Bundles.watcher = null
  Bundles.configFile = ''
  Bundles.dataFiles = []
  // @todo Create bundles Map (in addition to bundles Array).
  Bundles.bundles = []
  // @todo Create files Map.
  // Bundles.files = Bundles.files instanceof Map ? Bundles.files.clear() : new Map()
  Bundles.options = {
    run: true,
    cwd: process.cwd(),
    watch: false,
    loglevel: 'info',
    glob: {
      dot: true
    },
    frontMatter: {},
    chokidar: {}
  }
  Bundles.data = {}
  return Bundles
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundles
