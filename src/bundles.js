/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import cosmiconfig from 'cosmiconfig'
import merge from '@brikcss/merge'
import _ from './utilities.js'
import Bundle from './bundle.js'

// -------------------------------------------------------------------------------------------------
// Bundles.
//

Bundles.create = parseConfig
Bundles.run = runBundles
Bundles.report = logResults
Bundles.result = {
  success: false,
  watching: false,
  bundles: [],
  bundlesMap: {}
}

/**
 * Main Bundles() function.
 * @param {String|Object|Object[]} bundles  Bundles configuration.
 * @param {Object} options  Runtime options.
 */
function Bundles (bundles, options = {}) {
  return Bundles.create(bundles, options)
    .then(Bundles.run)
    .then(Bundles.report)
    .catch(error => {
      log.error(error)
      return error
    })
}

/**
 * Parse bundles configuration.
 * @param  {String|Object|Object[]} bundles  Bundles configuration.
 * @param  {Object} options  Global bundle options.
 * @return {Object}  Bundles dictionary Object.
 */
function parseConfig (bundles = '', options = {}) {
  return new Promise((resolve, reject) => {
    // Set default log level (may get overridden by other log.setLevel() method).
    log.setDefaultLevel(
      ['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(options.loglevel)
        ? options.loglevel
        : 'info'
    )

    // If bundles is a String, treat it as a filepath to the config file.
    if (typeof bundles === 'string') {
      // The bundles String is split at the first ":" character and the 2nd item in the split, if
      // existent, is the run property.
      bundles = bundles.split(':')
      if (!options.run && bundles[1]) options.run = bundles[1]
      bundles = bundles[0]

      // Get the config file.
      const configFile = resolveConfigFile(bundles)
      if (!configFile) return reject(new Error(`Config file not found. ${bundles}`))

      // Destructure configFile.
      bundles = configFile.config
      options.path = path.relative(process.cwd(), configFile.filepath)
    }

    // If bundles is an Object, convert it to an Array of bundles.
    if (_.isObject(bundles)) bundles = convertBundlesToArray(bundles, options)

    // Make sure bundles is an Array.
    if (!(bundles instanceof Array)) return reject(new Error('Bundles must be an Object or Object[].'))

    // Return bundles.
    return resolve(createBundlesFromArray(bundles, options))
  })
}

/**
 * Run configured bundles.
 * @param  {Object[]} bundles  Array of configured bundles.
 * @param  {Object} options  Runtime options.
 * @return {Object[]}  Array of bundles.
 */
function runBundles (bundles, options) {
  return Promise.all(bundles.map(bundle => bundle.run()))
}

/**
 * Log results to console.
 *
 * @param   {Object[]}  bundles  Resulting bundle Objects.
 * @return  {Object}  Bundles result Object.
 */
function logResults (bundles) {
  // Reset success.
  Bundles.result.success = true

  // Cache bundle results.
  Bundles.result.bundles = bundles

  // Iterate through bundles and create a bundlesMap...
  Bundles.result.bundlesMap = Bundles.result.bundles.reduce((bundlesMap, bundle, i) => {
    // Check for success of each bundle/bundler.
    if (!bundle._meta.valid || !bundle.success) Bundles.result.success = false
    // Create mapped bundle.
    bundlesMap[bundle.id] = Bundles.result.bundles[i]
    return bundlesMap
  }, {})

  // Log results.
  log.info(Bundles.result.success ? '[ok] Success!' : '[!!] Failed. Check errors.')

  // Return result.
  return Bundles.result
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Convert bundles from an Object to an Array.
 * @param  {Object}  bundles  User config Object.
 * @param  {Object} options  Global user options.
 * @return {Array}  Bundles Array.
 */
function convertBundlesToArray (bundles = {}, options = {}) {
  // If it has the bundles prop, treat it as a config Object and merge the options and data
  // props with Bundles config.
  if (bundles.bundles) {
    if (bundles.options) options = merge(options, bundles.options)
    if (bundles.data) Bundle.prototype.data = bundles.data
    bundles = _.isObject(bundles.bundles) ? [bundles.bundles] : bundles.bundles
  // If it has input and bundlers props, treat it as the only bundle.
  } else if (bundles.input && bundles.bundlers) {
    bundles = [bundles]
  // Otherwise treat the Object as a bundles dictionary, where each key is the bundle.id and
  // contains the bundle config Object.
  } else {
    bundles = Object.keys(bundles).map((id, i) => {
      const bundle = bundles[id]
      bundle.id = id
      return bundle
    })
  }

  // Return Array of bundles.
  if (_.isObject(bundles)) bundles = [bundles]
  return bundles
}

/**
 * Create bundles from global user config.
 * @param  {Array}  bundles  Array of bundle Objects.
 * @param  {Object} options  User options.
 * @return {Array}  Bundles Array.
 */
function createBundlesFromArray (bundles = [], options = {}) {
  // Cache user config to Bundle.prototype so newly created Bundles inherit these options.
  Bundle.prototype.options = merge([Bundle.prototype.options || {}, options], { arrayStrategy: 'overwrite' })

  // Create a new Bundle Object from each user configured bundle.
  bundles = bundles.map((bundle, i) => {
    // The bundle must be an Object.
    if (!_.isObject(bundle)) {
      log.error(`Bundle [${i}] was not added, it must be an Object.`)
      return { input: bundle, _meta: { valid: false } }
    }
    // Create and return the new Bundle.
    bundle.id = bundle.id || i
    bundle = new Bundle(bundle)
    bundle._meta.configFile = options.path
    return bundle
  })

  // Reset Bundle.prototype.options to its original defaults.
  Bundle.prototype.options = Object.assign({}, Bundle.prototype.defaults)

  return bundles
}

/**
 * Resolve config file.
 * @param  {String}  filepath  Path to config file.
 * @return {Object|undefined|Error}  Configuration Object, undefined, or Error.
 */
function resolveConfigFile (filepath = '') {
  const config = cosmiconfig('bundles')
  let configFile

  // If filepath === '', search for a default config file.
  if (!filepath) {
    configFile = config.searchSync('')
    log.info(`Found config file: ${path.relative(process.cwd(), configFile.filepath)}`)
  // If filepath exists, load that specific file.
  } else if (typeof filepath === 'string') {
    if (!fs.pathExistsSync(filepath)) return configFile
    configFile = config.loadSync(filepath)
  }

  return configFile
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundles
