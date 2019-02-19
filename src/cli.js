/*! bundles-cli.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//

import fs from 'fs-extra'
import minimist from 'minimist'
import bundles from '../lib/bundles.js'

const globalOptions = minimist(process.argv.slice(2), {
  boolean: true,
  alias: {
    config: 'C',
    data: 'D',
    bundlers: 'B',
    run: 'R',
    watch: 'W',
    loglevel: 'L',
    glob: 'G',
    frontMatter: 'M',
    chokidar: 'C'
  }
})

// Parse object properties to an Object.
const objectProps = ['glob', 'frontMatter', 'chokidar']
objectProps.forEach(prop => {
  if (globalOptions[prop]) globalOptions[prop] = JSON.parse(globalOptions[prop])
})

// Grab data file if exists.
if (globalOptions.data && fs.pathExistsSync(globalOptions.data)) {
  globalOptions.data = require(globalOptions.data)
}

// -------------------------------------------------------------------------------------------------
// Run bundles.
//

// Create bundles.
const bundlesConfig = globalOptions._ && globalOptions._.length ? {
  input: globalOptions._,
  bundlers: globalOptions.bundlers,
  data: globalOptions.data
} : globalOptions.config || ''

// Run it.
bundles(bundlesConfig, globalOptions).then(result => {
  process.exit()
})
