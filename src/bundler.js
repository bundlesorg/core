/*! bundler.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import path from 'path'
import _ from './utilities'

// -------------------------------------------------------------------------------------------------
// Bundler constructor and prototype.
//

/**
 * Bundler constructor.
 * @param {Object} bundler
 */
function Bundler (bundler = {}) {
  // Ensure bundler is an Object.
  if (!_.isObject(bundler)) this.run = bundler

  // Merge bundler down to this instance.
  Object.keys(bundler).forEach(key => { this[key] = bundler[key] })

  // Normalize bundler.
  this.valid = true
  this.success = false

  // Validate bundler.run.
  if (!this.run || !['string', 'function'].includes(typeof this.run)) {
    this.valid = false
  }

  if (typeof this.run === 'string') {
    // If bundler.run is a relative path, resolve the path.
    if (this.run.indexOf('./') === 0 || this.run.indexOf('../') === 0) {
      this.run = path.resolve(this.run)
    }

    // Require module.
    this.run = _.requireModule(this.run, 'Error creating bundler...') || this.run
  }

  // At this point if bundler.run is not a function, skip it.
  if (typeof this.run !== 'function') {
    this.valid = false
  }
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export default Bundler
