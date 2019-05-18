/*! bundles-cli.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//

import minimist from 'minimist'
import merge from '@brikcss/merge'
import path from 'path'
import _ from './utilities'
import Bundles from '../lib/bundles.js'

const cli = minimist(process.argv.slice(2), {
  boolean: true
})
let config = {
  bundles: undefined,
  options: {},
  data: {}
}

// -------------------------------------------------------------------------------------------------
// Normalize cli options.
//

// Parse cli configuration.
const objectProps = ['data', 'config', 'bundlers', 'glob', 'frontMatter', 'chokidar']
const optionsProps = ['run', 'watch', 'cwd', 'loglevel', 'glob', 'frontMatter', 'chokidar']
Object.keys(cli).forEach(prop => {
  // Convert configured props to an object.
  if (objectProps.includes(prop) && (cli[prop][0] === '{' || cli[prop][0] === '[')) {
    cli[prop] = JSON.parse(cli[prop])
  }
  // Attach optionsProps to config.options.
  if (optionsProps.includes(prop)) {
    config.options[prop] = cli[prop]
  }
})

// Parse cli.data.
if (typeof cli.data === 'string') {
  config.data = _.requireModule(path.resolve(cli.data))
}

// Parse cli.config.
if (_.isObject(cli.config) && cli.config.bundles) {
  config = merge([config, cli.config], { arrayStrategy: 'overwrite' })
} else {
  config.bundles = cli.config
}

// If input and bundlers exist, create a bundle and push to config.bundles.
if (!cli.config && cli._ && cli._.length && cli.bundlers) {
  if (typeof cli.bundlers === 'string') cli.bundlers = _.convertStringToArray(cli.bundlers)

  const bundle = {
    id: cli.id || 'cli',
    input: cli._,
    bundlers: cli.bundlers
  }
  if (!config.bundles) config.bundles = [bundle]
  else if (config.bundles instanceof Array) config.bundles.unshift(bundle)
  else if (_.isObject(config.bundles)) config.bundles = [bundle, config.bundles]
}

// -------------------------------------------------------------------------------------------------
// Run bundles.
//

// Run it.
if (!config.bundles) config.bundles = ''
Bundles.run(config)
