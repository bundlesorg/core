#! /usr/bin/env node
/*! bundles-cli.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//

const bundle = require('../lib/bundles.min.js')
const config = require('minimist')(process.argv.slice(2), {
  boolean: true,
  alias: {
    bundles: 'B',
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

// -------------------------------------------------------------------------------------------------
// Run bundles.
//

bundle(config._[0], config)
