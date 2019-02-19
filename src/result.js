/*! result.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

import log from 'loglevel'
const result = {
  success: false,
  errors: [],
  watching: false,
  bundles: [],
  bundlesMap: [],
  /**
   * Log results to console.
   * @param   {Object[]}  bundles
   * @return  {Object}  Result Object.
   */
  log (bundles) {
    // Create a bundles map, for convenience.
    result.bundles = bundles
    result.bundlesMap = result.bundles.reduce((bundlesMap, bundle, i) => {
      bundlesMap[bundle.id] = result.bundles[i]
      return bundlesMap
    }, {})

    // Check the success of the bundles.
    result.success = !result.bundles.some(bundle => !bundle._meta.valid || !bundle.success)

    // Log results.
    if (result.errors.length > 1) {
      log.error(result.errors.length > 1 ? `There were ${result.errors.length} errors...` : 'There was an error...')
      result.errors.forEach(error => log.error(error))
    }
    if (result.success) {
      log.info(`[ok] Success${result.errors.length ? ` with ${result.errors.length} error(s).` : '!'}`)
    } else {
      log.info('[!!] Failed. Check errors.')
    }

    // Return result.
    return result
  }
}

export default result
