/*! parser.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import log from 'loglevel'
import path from 'path'
import cosmiconfig from 'cosmiconfig'
import merge from '@brikcss/merge'
import _ from './utilities.js'

// -------------------------------------------------------------------------------------------------
// Exports and helper functions.
//

const defaultOptions = {
  run: true,
  cwd: process.cwd(),
  watch: false,
  watchFiles: [],
  loglevel: 'info',
  glob: {
    dot: true
  },
  frontMatter: {},
  chokidar: {}
}

/**
 * Parse bundles configuration.
 *
 * @param  {String|Object|Object[]} config  Bundles configuration.
 * @return {Object}  Bundles dictionary Object.
 */
function parseConfig (config = '') {
  // Make sure config is a properly formed global config object.
  config = normalizeConfig(config)

  // Make sure all global props exist and return the config.
  if (!_.isObject(config.options)) config.options = {}
  if (!_.isObject(config.data) && typeof config.data !== 'function') config.data = {}
  if (!_.isObject(config.on)) config.on = {}
  config.options = merge([{}, defaultOptions, config.options], { arrayStrategy: 'overwrite' })

  // Get config file children data files if a config file exists.
  if (config.configFile) {
    const configFilepath = path.resolve(config.configFile)
    config.dataFiles = [configFilepath].concat(_.getChildrenModules(configFilepath))
    log.info(`Using config file: ${path.relative(config.options.cwd, config.configFile)}`)
  }

  if (!(config.bundles instanceof Array)) throw new Error('Bundles must be configured as an Object or Object[].')

  // Return config.
  return config
}

/**
 * Normalize user configuration -- with any config file already resolved -- to a global config
 * Object with bundles, options, and data properties.
 *
 * @param {Array|Object} config  User configuration. Can be a global config object, a bundles array,
 *     a single array, or an object dictionary.
 * @return {Object}  Global config object.
 */
function normalizeConfig (config) {
  // If config is a String, resolve it as a config file.
  if (typeof config === 'string' || config === undefined) config = resolveConfigFile(config)
  // Ensure config is an Object with the bundles property.
  if (!_.isObject(config)) config = { bundles: config }
  // If the bundles property exists, ensure it's an Array and return the config.
  if (config.hasOwnProperty('bundles')) {
    // If config.bundles is a String, resolve it.
    if (typeof config.bundles === 'string' || config.bundles === undefined) {
      const configFile = resolveConfigFile(config.bundles)
      config = merge([{}, resolveConfigFile(config.bundles), config, { bundles: configFile.bundles }], { arrayStrategy: 'overwrite' })
    }
    if (!(config.bundles instanceof Array)) config.bundles = [config.bundles]
  // Convert a single bundle object to a bundles Array.
  } else if (config.input || config.bundlers) {
    config = { bundles: [config] }
  // Convert a bundle Object dictionary to an Array.
  } else {
    config = {
      bundles: Object.keys(config).map((id, i) => {
        const bundle = config[id]
        bundle.id = id
        return bundle
      })
    }
  }
  return config
}

/**
 * Resolve config file.
 * @param  {String}  filepath  Path to config file.
 * @param  {String}  cwd  Current working directory.
 * @return {Object|undefined|Error}  Configuration Object, undefined, or Error.
 */
function resolveConfigFile (filepath = '', cwd) {
  const config = cosmiconfig('bundles')
  let run
  let configFile
  cwd = cwd || process.cwd()

  // filepath can be separated with a ':' and have a list of bundle IDs to run. Separate bundle IDs from the filepath here.
  if (filepath.indexOf(':') > -1) {
    configFile = filepath.split(':')
    if (configFile[1]) run = configFile[1]
    filepath = configFile[0]
  }

  // If there's no filepath, search for a default config file.
  if (!filepath) {
    configFile = config.searchSync('')
  // If filepath exists, load that specific file.
  } else if (typeof filepath === 'string') {
    configFile = config.loadSync(filepath)
  }

  // Properly form the configFile.
  configFile.config = normalizeConfig(configFile.config)
  configFile.config.configFile = configFile.filepath
  if (!_.isObject(configFile.config.options)) configFile.config.options = {}
  configFile.config.options.run = run

  // Return it.
  return configFile.config
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export { parseConfig, defaultOptions }
