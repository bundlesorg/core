/*! result.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

const log = require('loglevel')
const result = {
  success: false,
  errors: [],
  watching: false,
  bundles: [],
  bundlesMap: [],
  config: {
    path: undefined,
    run: false,
    watch: false,
    loglevel: 'info',
    glob: {
      dot: true
    },
    frontMatter: {},
    chokidar: {}
  },
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
  },
  /**
   * Update config Object.
   * @param {Object} value
   */
  setConfig (value = {}) {
    // Convert run and watch options to an Array.
    ['run', 'watch'].forEach(key => {
      if (value[key] && typeof value[key] === 'string') {
        value[key] = value[key].split(/,?\s+/)
      } else if (typeof value[key] !== 'boolean' && !(value[key] instanceof Array)) {
        value[key] = value[key] || false
      }
    })

    // Set new options.
    // console.log('RESULT BEFORE:', result.config)
    result.config = Object.assign(result.config || {
      path: undefined,
      run: false,
      watch: false,
      loglevel: 'info',
      glob: {
        dot: true
      },
      frontMatter: {},
      chokidar: {}
    }, value)
    // console.log('RESULT AFTER:', result.config)

    // Return result.
    return result
  }
}

module.exports = result
