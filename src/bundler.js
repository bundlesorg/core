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
  else Object.keys(bundler).forEach(key => { this[key] = bundler[key] })

  // Normalize bundler.
  this.valid = true
  this.success = false
  this.id = ''

  // Validate bundler.run.
  if (!this.run || !['string', 'function'].includes(typeof this.run)) {
    this.valid = false
  }

  if (typeof this.run === 'string') {
    this.id = this.run[0] === '.' ? path.resolve(this.run) : _.requireModulePath(this.run)

    // Resolve and require the module.
    this.run = _.requireModule(
      this.run[0] === '.'
        ? path.resolve(this.run)
        : this.run,
      'Error creating bundler...'
    ) || this.run

    // Cache data file paths so we can watch them.
    this.dataFiles = _.getChildrenModules(this.id)
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
