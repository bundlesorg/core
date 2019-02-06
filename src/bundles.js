/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import result from './result.js'
import _ from './utilities.js'
import Bundle from './bundle.js'
import cosmiconfig from 'cosmiconfig'

// -------------------------------------------------------------------------------------------------
// Bundles.
//

function Bundles (bundles, options = {}) {
  result.setConfig(options)
  return parseConfig(bundles, options)
    .then(createBundles)
    .then(runResult => runParsedBundles(runResult, result.config.run))
    .catch(error => {
      log.error(error)
      return error
    })
}

/**
 * Run one or multiple bundles.
 * @param  {Object|Object[]}  bundles  One or more bundles.
 * @param {String[]|Boolean} run  Array of bundle IDs to run. Or set true to force all to run.
 * @return {Array}  Compiled bundles.
 */
function runParsedBundles (bundles = [], run) {
  if (run) result.setConfig({ run })
  const runAll = !run || run === true || !(run instanceof Array)
  if (_.isObject(bundles)) bundles = [bundles]
  // Map each bundle to a promise so they can run in parallel.
  return Promise.all(bundles.map(bundle => {
    if (!runAll && !run.includes(bundle.id)) {
      bundle.success = 'skipped'
      return bundle
    }
    return bundle.run()
  })).then(result.log)
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Parse bundles configuration.
 * @param  {String|Object|Object[]} bundles  Bundles configuration.
 * @param  {Object} options  Bundles options.
 * @return {Object}  Bundles dictionary Object.
 */
function parseConfig (bundles = '', options = {}) {
  return new Promise((resolve, reject) => {
    // Cache user config.
    result.setConfig(_.isObject(options) ? options : {})
    Bundle.setDefaults({ options })

    // Set default log level (may get overridden by other log.setLevel() method).
    log.setDefaultLevel(
      ['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(result.config.loglevel)
        ? result.config.loglevel
        : 'info'
    )

    // If bundles is a String, treat it as a filepath to the config file.
    if (typeof bundles === 'string') {
      // The bundles String is split at the first ":" character and the 2nd item in the split, if
      // existent, is the run property.
      bundles = bundles.split(':')
      if (!result.config.run && bundles[1]) result.setConfig({ run: bundles[1] })
      bundles = bundles[0]

      // Get the config file.
      const configFile = resolveConfigFile(bundles)
      if (!configFile) return reject(new Error(`Config file not found. ${bundles}`))

      // Set bundles and results props.
      bundles = configFile.config
      result.config.path = path.relative(process.cwd(), configFile.filepath)
    }

    // If bundles is an Object, convert it to an Array of bundles.
    if (_.isObject(bundles)) {
      // If it has the bundles prop, treat it as a config Object and merge the options and data
      // props with Bundles config.
      if (bundles.bundles) {
        if (bundles.options) result.setConfig(Object.assign({}, bundles.options, result.config))
        if (bundles.data) Bundle.setDefaults({ options: result.config, data: bundles.data })
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
    }

    // Make sure bundles is an Array.
    if (!(bundles instanceof Array)) {
      return reject(new Error('Bundles must be an Object or Object[].'))
    }

    // Return bundles.
    return resolve(bundles)
  })
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

/**
 * Create Bundles from user configuration.
 * @param  {Array}  bundles User configured bundles.
 * @return {Array}  Array of Bundle Objects.
 */
function createBundles (bundles = []) {
  // Make sure bundles is an Array.
  if (!(bundles instanceof Array)) bundles = [bundles]

  // Create a new Bundle Object from each user configured bundle.
  bundles = bundles.map((bundle, i) => {
    // The bundle must be an Object.
    if (!_.isObject(bundle)) {
      Bundles.result.errors.push(`Bundle [${i}] was not added, it must be an Object.`)
      return { input: bundle, _meta: { valid: false } }
    }
    // Create and return the new Bundle.
    bundle.id = bundle.id || i
    bundle = new Bundle(bundle)
    bundle._meta.configFile = result.config.path
    return bundle
  })
  return bundles
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

Bundles.run = Bundles
Bundles.result = result

export default Bundles
