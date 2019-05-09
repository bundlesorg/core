/*! utilities.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

import log from 'loglevel'
import path from 'path'

/**
 * Check if value is a true Object.
 * @param  {any}  value  Variable to check.
 * @return {Boolean}  Whether value is a true Object.
 */
function isObject (value) {
  return trueType(value) === 'object'
}

/**
 * Return true type of value.
 *
 * @param {any} value  The value to check.
 * @return {String}  The value's type as a lowercase string.
 */
function trueType (value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}

/**
 * Convert comma-separated String to Array of Strings.
 *
 * @param   {string}  [value='']  Comma-separated string.
 * @return  {string}  Array of String values.
 */
function convertStringToArray (value) {
  if (typeof value !== 'string') return value
  return value.split(/\s*,\s*/)
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
  if (typeof value === 'string') value = convertStringToArray(value)
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
function requireModule (filepath, { errorMessage, logToConsole = true } = {}) {
  let result
  try {
    result = require(filepath)
  } catch (error) {
    if (logToConsole) log.error((errorMessage || `Error importing ${filepath}:`), error)
  }
  return result
}

/**
 * Get children modules of a given node module.
 *
 * @param   {String}  modulePath  Module path to get children for.
 * @return  {Array}  Children modules.
 */
function getChildrenModules (modulePath) {
  modulePath = path.resolve(modulePath)
  if (!require.cache[modulePath] || !require.cache[modulePath].children.length) return []
  return require.cache[modulePath].children.reduce((result, child) => {
    if (child.id.includes('node_modules') || result.includes(child.id)) return result
    result.push(child.id)
    if (child.children.length) result = result.concat(getChildrenModules(child.id))
    return result
  }, [])
}

/**
 * Get difference, in seconds or milliseconds, between two dates/times.
 *
 * @param   {Date}  start  Start Date.
 * @param   {Object}  [options={}]  Configuration options.
 * @param   {Date}  options.end  End Date object.
 * @param   {string}  [options.suffix='s']  Suffix to attach.
 * @return  {string}  The time difference.
 */
function getTimeDiff (start, { end, suffix = 's' } = {}) {
  if (!start) return '0ms'
  end = end || new Date()
  let diff = Math.abs(end - start)
  if (diff >= 1000) diff = (diff / 1000).toFixed(2)
  else suffix = 'ms'
  return diff.toString() + suffix
}

export default {
  isObject,
  trueType,
  convertStringToArray,
  idExistsInValue,
  poll,
  requireModule,
  getChildrenModules,
  getTimeDiff
}
