#! /usr/bin/env node
/*! bundles-cli.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//

const bundle = require('../lib/bundles.js')
const config = require('minimist')(process.argv.slice(2), {
  boolean: true,
  alias: {
    bundles: 'B',
    watch: 'W'
  }
})

// -------------------------------------------------------------------------------------------------
// Run bundles.
//

bundle(config._[0], config)
