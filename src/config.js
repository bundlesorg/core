/*! parser.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import cosmiconfig from 'cosmiconfig'
import merge from '@brikcss/merge'
import _ from './utilities.js'

// -------------------------------------------------------------------------------------------------
// Methods and helper functions.
//

/**
 * Parse bundles configuration.
 *
 * @param  {String|Object|Object[]} config  Bundles configuration.
 * @return {Object}  Bundles dictionary Object.
 */
function parseConfig (config = '') {
  const Bundles = this

  // Make sure config is an object and that config.bundles properly exists.
  if (!_.isObject(config) || config.bundles === undefined) config = { bundles: config }

  // If bundles is a String, treat it as a filepath to the config file.
  if (typeof config.bundles === 'string') {
    // The bundles String is split at the first ":" character and the 2nd item in the split, if
    // existent, is the run property.
    let configFile = config.bundles.split(':')
    if (!Bundles.options.run && configFile[1]) Bundles.options.run = configFile[1]
    configFile = configFile[0]

    // Get the config file.
    configFile = resolveConfigFile(config.bundles, Bundles.options.cwd)
    if (!configFile) throw new Error(`Config file not found. ${config}`)

    // Destructure configFile.
    Bundles.configFile = path.relative(Bundles.options.cwd, configFile.filepath)
    configFile = configFile.config
    if (_.isObject(configFile) && configFile.bundles) {
      config.bundles = configFile.bundles;
      ['options', 'data'].forEach(key => {
        if (!configFile[key]) return
        config[key] = merge([config[key] || {}, configFile[key]], { arrayStrategy: 'overwrite' })
      })
    } else {
      config.bundles = configFile
    }
  }

  // Update globals.
  if (config.options || config.data) {
    Bundles.globals({ options: config.options, data: config.data })
  }

  // Ensure bundles is an Array.
  if (_.isObject(config.bundles)) {
    // Convert a single bundle object to an Array.
    if (config.bundles.input || config.bundles.bundlers) {
      config.bundles = [config.bundles]
    // Convert a bundle Object dictionary to an Array.
    } else {
      config.bundles = Object.keys(config.bundles).map((id, i) => {
        const bundle = config.bundles[id]
        bundle.id = id
        return bundle
      })
    }
  }

  // Set default log level (may get overridden by other log.setLevel() method).
  log.setDefaultLevel(
    ['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(Bundles.options.loglevel)
      ? Bundles.options.loglevel
      : 'info'
  )

  // Create bundles Array.
  Bundles.add(config.bundles)
  if (!(Bundles.bundles instanceof Array)) throw new Error('Bundles must be configured as an Object or Object[].')

  // Create bundles and return Bundles.
  return Bundles
}

/**
 * Resolve config file.
 * @param  {String}  filepath  Path to config file.
 * @param  {String}  cwd  Current working directory.
 * @return {Object|undefined|Error}  Configuration Object, undefined, or Error.
 */
function resolveConfigFile (filepath = '', cwd) {
  const config = cosmiconfig('bundles')
  let configFile

  // If filepath === '', search for a default config file.
  if (!filepath) {
    configFile = config.searchSync('')
  // If filepath exists, load that specific file.
  } else if (typeof filepath === 'string') {
    if (!fs.pathExistsSync(filepath)) return configFile
    configFile = config.loadSync(filepath)
  }
  // Notify user of config file.
  log.info(`Using config file: ${path.relative(cwd || process.cwd(), configFile.filepath)}`)

  return configFile
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export { parseConfig }
