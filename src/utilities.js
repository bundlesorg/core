/*! utilities.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

import log from 'loglevel'

/**
 * Check if value is a true Object.
 * @param  {any}  value  Variable to check.
 * @return {Boolean}  Whether value is a true Object.
 */
function isObject (value) {
  return typeof value === 'object' && value.constructor === Object
}

/**
 * Convert comma-separated String to Array of Strings.
 *
 * @param   {string}  [value='']  Comma-separated string.
 * @return  {string}  Array of String values.
 */
function convertStringToArray (value) {
  if (typeof value !== 'string') return value
  return value.split(/,?\s+/)
}

/**
 * Check if a String identifier exists as a subset of another value which is either a
 * comma-separated String or an Array.
 *
 * @param  {Boolean|String[]|String}  value  Value to check.
 * @param  {String} string  String to check against.
 * @return {Boolean}  Whether string is included in value.
 */
function idExistsInValue (value, string) {
  if (typeof value === 'string') value = value.split(/,?\s+/)
  return value === true || (value instanceof Array && value.includes(string))
}

/**
 * Poll until a condition is met or it times out.
 *
 * @param   {(Function|string)}  fn  Callback function.
 * @param   {Number}  timeout   The timeout
 * @param   {Number}  interval  The interval
 * @return  {Promise}  Promise that resolves when the condition is met or times out.
 */
function poll (fn, timeout, interval) {
  const endTime = Number(new Date()) + (timeout || 2000)
  interval = interval || 100

  const checkCondition = function (resolve, reject) {
    // If the condition is met, we're done!
    const result = fn()
    if (result) {
      resolve(result)
    // If the condition isn't met but the timeout hasn't elapsed, go again
    } else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject)
    // Didn't match and too much time, reject!
    } else {
      reject(new Error('timed out for ' + fn + ': ' + arguments))
    }
  }

  return new Promise(checkCondition)
}

/**
 * Require a module without failing if the module doesn't exist.
 *
 * @param  {Sring}  filepath  Module filepath.
 * @param  {Sring}  errorMessage  Error message in case of error.
 */
function requireModule (filepath, errorMessage) {
  let result
  try {
    result = require(filepath)
  } catch (error) {
    log.error((errorMessage || `Error importing ${filepath}:`), error)
  }
  return result
}

export default {
  isObject,
  convertStringToArray,
  idExistsInValue,
  poll,
  requireModule
}
