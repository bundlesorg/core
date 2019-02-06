/*! utilities.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

/**
 * Check if value is a true Object.
 * @param  {any}  value  Variable to check.
 * @return {Boolean}  Whether value is a true Object.
 */
function isObject (value) {
  return typeof value === 'object' && value.constructor === Object
}

/**
 * Check if string exists in an Array.
 * @param  {String} string     Bundle ID.
 * @param  {Array}  values Values to check.
 * @return {Boolean}  Whether string exists in values Array.
 */
function existsInArray (string = '', values) {
  if (!values || (values instanceof Array && !values.length)) return false
  if (typeof values === 'string') values = values.split(/,?\s+/)
  return values.includes(string)
}

module.exports = {
  isObject,
  existsInArray
}
