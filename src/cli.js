/*! bundles-cli.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//

import fs from 'fs-extra'
import bundle from '../module/bundles.js'
import minimist from 'minimist'

const config = minimist(process.argv.slice(2), {
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
  if (config[prop]) config[prop] = JSON.parse(config[prop])
})

// Grab data file if exists.
if (config.data && fs.pathExistsSync(config.data)) {
  config.data = require(config.data)
}

// -------------------------------------------------------------------------------------------------
// Run bundles.
//

bundle(config.config || {
  input: config._,
  bundlers: config.bundlers,
  data: config.data
}, config)
