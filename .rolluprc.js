/*! .rolluprc.js | @author brikcss <https://github.com/brikcss> | @reference <https://rollupjs.org> */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import configGen from '@brikcss/rollup-config-generator'
import pkg from './package.json'
const external = [...Object.keys(pkg.dependencies), 'path', 'fs-extra', 'child_process']

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default configGen.create([
  {
    type: 'node',
    input: 'src/bundles.js',
    external
  }, {
    type: 'cli',
    input: 'src/cli.js',
    external,
    output: { file: 'bin/bundles.js' }
  }
])
