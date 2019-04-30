/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import merge from '@brikcss/merge'
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
  create: parseConfig,
  // Add one or more bundle to Bundles.bundles.
  add: addBundles,
  // Run one or more bundles.
  bundle: bundle,
  // Set/update globals.
  globals: setGlobals,
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
 * @param   {object|object[]|string}  [config={}]  Bundles configuration.
 * @return  {object}  Bundles result.
 */
function runAll (config = '') {
  log.setDefaultLevel('info')
  log.info('Running Bundles...')
  return Bundles.create(config).bundle()
}

/**
 * Run or rerun previously parsed/configured bundles.
 *
 * @param  {String|String[]} ?bundleIds  Bundle IDs to run. Can be comma-separated String or Array
 *     of Strings. If undefined or not a String or Array, will run all bundles.
 * @return {Promise}  Promise that resturns Bundles.
 */
function bundle (bundleIds) {
  bundleIds = _.convertStringToArray(bundleIds)
  // @todo Change `bundles` to be list of bundle IDs to run, and have this method filter bundles to
  //     run from Bundles.bundles.
  return Promise.all(Bundles.bundles.map(bundle => {
    if (bundleIds instanceof Array && !bundleIds.includes(bundle.id)) return bundle
    return bundle.run()
  })).then(() => {
    Bundles.success = Bundles.bundles.every(bundle => !!bundle.success)
    log.info(Bundles.success ? '[ok] Success!' : '[!!] Failed. Check errors.')
    return Bundles
  }).catch(error => {
    log.error(error)
    return error
  })
}

/**
 * Easily update properties in Bundles global objects.
 *
 * @param  {object}  [globals={}]  Globals to merge into existing Bundles global objects.
 */
function setGlobals (globals = {}) {
  ['options', 'data'].forEach(key => {
    if (!globals[key]) return
    if (_.isObject(globals[key])) {
      this[key] = merge([this[key], globals[key]], { arrayStrategy: 'overwrite' })
    }
  })
}

/**
 * Reset Bundles props to their initial state.
 */
function resetBundles () {
  this.initialized = true
  this.success = false
  this.watching = false
  this.configFile = null
  // @todo Create bundles Map (in addition to bundles Array).
  this.bundles = []
  // @todo Create files Map.
  // this.files = this.files instanceof Map ? this.files.clear() : new Map()
  this.options = {
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
  this.data = {}
}

/**
 * Add one or more bundles to Bundles.bundles global configuration.
 *
 * @param   {Object|Object[]}   [bundles=[]]  One or more bundle configuration objects.
 * @return  {Object}  Bundles global configuration.
 */
function addBundles (bundles = []) {
  if (_.isObject(bundles)) bundles = [bundles]
  // Create a new Bundle Object from each user configured bundle.
  bundles.forEach((bundle, index) => {
    // The bundle must be an Object.
    if (!_.isObject(bundle)) {
      log.error(`Bundle [${index}] was not added, it must be an Object.`)
      return { input: bundle, valid: false }
    }
    // Create and return the new Bundle.
    bundle.id = bundle.id || index.toString()
    // Instantiate new bundle.
    bundle = new Bundle(bundle, Bundles)
    bundle.configFile = Bundles.configFile
    Bundles.bundles.push(bundle)
  })

  return Bundles
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundles
