/*! .rolluprc.js | @author brikcss <https://github.com/brikcss> | @reference <https://jest.io> */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import babel from 'rollup-plugin-babel'
import { terser as uglify } from 'rollup-plugin-terser'
import pkg from './package.json'

// Flags.
const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'

// Set base options.
const base = {
  input: 'src/bundles.js',
  cliInput: 'src/cli.js',
  watch: {
    chokidar: true,
    include: 'src/**',
    exclude: 'node_modules/**',
    clearScreen: true
  }
}

// -------------------------------------------------------------------------------------------------
// Config variations.
//

let configs = []

configs.push({
  input: base.input,
  output: [
    // CommonJS for Node.
    {
      file: pkg.main,
      format: 'cjs'
    }, {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    babel({
      exclude: ['node_modules/**'],
      presets: [['@babel/preset-env', {
        targets: {
          node: '8'
        }
      }]]
    }),
    isProd && uglify()
  ],
  watch: base.watch
}, {
  input: base.cliInput,
  output: [
    // CommonJS for Node.
    {
      file: pkg.bin.bundle,
      format: 'cjs'
    }
  ],
  plugins: [
    babel({
      exclude: ['node_modules/**'],
      presets: [['@babel/preset-env', {
        targets: {
          node: '8'
        }
      }]]
    }),
    isProd && uglify()
  ],
  watch: base.watch
})

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default configs
