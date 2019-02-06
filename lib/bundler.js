/*! bundler.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

const path = require('path')
const result = require('./result')
const _ = require('./utilities')

// -------------------------------------------------------------------------------------------------
// Bundler constructor and prototype.
//

/**
 * Bundler constructor.
 * @param {Object} bundler
 */
function Bundler (bundler = {}) {
  // Ensure bundler is an Object.
  if (!_.isObject(bundler)) bundler = { run: bundler }

  // Normalize bundler.
  bundler._meta = bundler._meta || {}
  bundler._meta.valid = true
  bundler.success = false

  // Validate bundler.run.
  if (typeof bundler.run === 'function') return bundler
  if (!bundler.run || typeof bundler.run !== 'string') {
    bundler._meta.valid = false
    return bundler
  }

  // If bundler.run is a relative path, resolve the path.
  if (bundler.run.indexOf('./') === 0 || bundler.run.indexOf('../') === 0) {
    bundler.run = path.resolve(bundler.run)
  }

  // Require module.
  try {
    bundler.run = require(bundler.run)
  } catch (error) {
    bundler._meta.valid = false
    result.errors.push(error)
    return bundler
  }

  // At this point if bundler.run is not a function, skip it.
  if (typeof bundler.run !== 'function') {
    bundler._meta.valid = false
  }

  // Return the bundler Object.
  return bundler
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

module.exports = Bundler
