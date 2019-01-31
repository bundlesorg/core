/*! bundles.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Set up environment.
//
const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')
const matter = require('gray-matter')
const log = require('loglevel')
const merge = require('@brikcss/merge')
let errors = []

// -------------------------------------------------------------------------------------------------
// Main functions.
//

function bundles (config = '', runOptions = {}) {
  // Get config file and merge with user config.
  return resolveConfig(config, runOptions)
    .then(runBundles)
    .then(createWatchers)
    .then(prepResults)
    .then(logResults)
    .catch(error => {
      log.error(error)
      return error
    })
}

function resolveConfig (config = '', runOptions = {}) {
  return new Promise((resolve, reject) => {
    let configFile = false

    // Fetch config filepath.
    if (typeof config === 'string') {
      const cosmiconfig = require('cosmiconfig')('bundles')
      // If config === '', search for a config file.
      if (!config) {
        config = cosmiconfig.searchSync(config)
        log.info(`Config file found: ${config.filepath}`)
      } else {
        const configExists = fs.pathExistsSync(config)
        if (!configExists) return reject(new Error('Config file not found.'))
        config = config.split(':')
        runOptions.bundles = runOptions.bundles || config[1] || undefined
        if (
          runOptions.bundles !== 'all' &&
          typeof runOptions.bundles === 'string'
        ) runOptions.bundles = runOptions.bundles.split(/,?\s+/)
        config = config[0]
        config = cosmiconfig.loadSync(config)
      }
      if (!config) return reject(new Error('Config file was not found.'))
      configFile = config.filepath
      config = config.config
    }

    // If config is an Object with `input` and `bundlers` props, set it as a bundle.
    if (config.input && config.bundlers) config = { bundles: [config] }

    // Merge config with defaults and runOptions with config.options.
    // NOTE: All defaults should be listed here to show them in one place.
    config = merge({
      success: false,
      bundles: [],
      bundlesMap: {},
      options: {
        glob: {
          dot: true
        }
      },
      data: {},
      watchers: {},
      on: {}
    }, config, {
      options: runOptions,
      _meta: {
        configFile,
        createdWatchers: false
      }
    })

    // Set loglevel.
    log.setDefaultLevel(['trace', 'debug', 'info', 'warn', 'error', 'silent'].includes(config.options.loglevel) ? config.options.loglevel : 'info')

    // Normalize all bundles.
    config.bundles = normalizeBundles(config.bundles, config.options, config.data)

    // Return resolved config.
    return resolve(config)
  })
}

function runBundles (config = {}) {
  const promises = []
  const bundles = []
  // Run each bundle that is valid and configured to run in `options.bundles`.
  config.bundles.forEach((bundle, i) => {
    if (
      bundle._meta.isValid &&
      (!config.options.bundles || config.options.bundles.includes(bundle.id))
    ) {
      bundles.push(bundle.id)
      promises.push(runBundle(bundle))
    } else {
      bundle.success = 'skipped'
      promises.push(bundle)
    }
  })
  log.info(`Bundling [${bundles.join(', ')}]...`)
  return Promise.all(promises).then(bundles => {
    config.bundles = bundles
    return config
  })
}

function createWatchers (config = {}) {
  // Only continue if watchers haven't already been created.
  if (config._meta.createdWatchers) return config
  config._meta.createdWatchers = true

  // Convert options.watch to Boolean or String[].
  if (typeof config.options.watch === 'string') config.options.watch = config.options.watch.split(/,?\s+/)
  // If options.watch is explicitly set to false, don't do anything.
  if (config.options.watch === false) return config
  // Otherwise make sure `options.watch` is a Boolean if it's not already an String[].
  else if (!(config.options.watch instanceof Array)) config.options.watch = Boolean(config.options.watch)

  // Iterate through bundles and create a watcher for each as configured.
  const chokidar = require('chokidar')
  const promises = []
  config.bundles.forEach((bundle, i) => {
    // If the bundle is not configured to be watched, or if a watcher already exists, skip it.
    if (!bundle.watch &&
      (
        !config.options.watch ||
        (config.options.watch instanceof Array &&
        config.options.watch.includes(bundle.id))
      ) &&
      !config.watchers[bundle.id]
    ) { return }
    // Create a watcher for this bundle.
    promises.push(new Promise((resolve, reject) => {
      const watcher = chokidar.watch(bundle.output.map(file => file.source.path), typeof bundle.watch === 'object' ? bundle.watch : {})
      watcher
        .on('change', (filepath) => {
          log.info(`File changed: ${path.relative(process.cwd(), filepath)}`)
          if (!bundle._meta.isWatching) return
          // Clear previous errors.
          errors = []
          // Set bundle to run.
          config.options.bundles = [bundle.id]
          // Read in changed source file.
          bundle.output.some((file, i) => {
            if (file.source.path === filepath) {
              bundle.output[i] = Object.assign(bundle.output[i], readFile(filepath, { globals: config.data, locals: bundle.data, options: bundle.options }))
              return true
            }
            return false
          })
          // Need to readFile() here.
          return runBundles(config).then(prepResults)
        })
        .on('error', reject)
        .on('ready', () => {
          bundle._meta.isWatching = true
          resolve()
        })
      // Add config file to watcher.
      if (config._meta.configFile) watcher.add(config._meta.configFile)
      // Add watcher to config.
      watcher.id = bundle.id
      config.watchers[bundle.id] = watcher
    }))
  })

  // Notify user of bundles being watched.
  if (promises.length) {
    log.info(`Watching [${Object.keys(config.watchers).join(', ')}]...`)
  }

  // Return config.
  return Promise.all(promises).then(() => config)
}

function prepResults (result = {}) {
  result.success = !result.bundles.some(bundle => !bundle._meta.isValid || !bundle.success)
  result.bundlesMap = {}
  result.bundles.forEach((bundle, i) => {
    result.bundlesMap[bundle.id] = result.bundles[i]
  })
  return result
}

function logResults (result = {}) {
  // Log results for user.
  if (errors.length) {
    log.error(errors.length > 1 ? `There were ${errors.length} errors...` : 'There was an error...')
    errors.forEach(error => log.error(error))
  }
  if (result.success) {
    log.info(`[ok] Success${errors.length ? ` with ${errors.length} error(s).` : '!'}`)
  } else {
    log.info('[!!] Failed. Check errors.')
  }
  // Reset errors and return result.
  errors = []
  return result
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

function runBundle (bundle = {}) {
  return bundle.bundlers.reduce((promise, bundler, i) => {
    return promise.then((bundle) => {
      return bundler.run(bundle, bundler)
    }).then(bundle => {
      bundler.success = true
      return bundle
    }).catch(error => {
      bundler.success = false
      errors.push(error)
      return bundle
    })
  }, Promise.resolve(bundle)).then(result => {
    result.success = result.bundlers.every(bundler => bundler.success)
    return result
  }).catch(error => {
    bundle.success = false
    errors.push(error)
    return bundle
  })
}

function normalizeBundles (bundles = [], options = {}, data = {}) {
  // Ensure bundles is an Array.
  if (bundles instanceof Object && bundles.constructor === Object) bundles = [bundles]
  if (!(bundles instanceof Array)) throwError('`config.bundles` must be an Array.')
  // Normalize each bundle.
  return bundles.map((bundle, bundleIndex) => normalizeBundle(bundle, options, bundleIndex, data))
}

function normalizeBundle (bundle = {}, options = {}, index, data = {}) {
  // Ensure bundle is an Object and is a valid bundle.
  if (!(bundle instanceof Object)) bundle = { _meta: { isValid: false } }

  // Normalize bundle with defaults.
  bundle = Object.assign({
    errors: [],
    id: String(index),
    input: [],
    output: [],
    bundlers: [],
    options: {},
    data: {},
    watch: Boolean(options.watch || bundle.watch),
    on: {},
    _meta: {}
  }, bundle)

  // Merge global and local options.
  bundle.options = merge({}, options, bundle.options)

  // Normalize output files (this mutates input and output properties).
  resolveOutputFiles(bundle, data)

  // Normalize bundlers.
  if (typeof bundle.bundlers === 'string') bundle.bundlers = bundle.bundlers.split(/,?\s+/)
  bundle.bundlers = bundle.bundlers.map(bundler => resolveBundler(bundler, bundle))

  // Make sure bundle is valid.
  bundle._meta.isValid = isValidBundle(bundle)

  // Return the bundle.
  return bundle
}

function resolveOutputFiles (bundle = {}, globals = {}) {
  // Ensure input is an Array.
  if (typeof bundle.input === 'string' || (typeof bundle.input === 'object' && bundle.input.constructor === Object)) {
    bundle.input = [bundle.input]
  }
  // Iterate through the input files to resolve the output files.
  bundle.input = bundle.input.reduce((result, entry, i) => {
    // 1) Resolve strings with globby.
    if (isGitRepo(entry)) entry = resolveGitRepo(entry)
    else if (typeof entry === 'string') entry = globby.sync(entry, bundle.options.glob)
    // 2) Resolve input and output for an Object.
    if (typeof entry === 'object' && entry.constructor === Object) {
      bundle.output.push(readFile(entry, { globals, locals: bundle.data, options: bundle.options }))
      result.push(entry.path)
    } else {
      bundle.output = bundle.output.concat(entry.map(file => readFile(file, { globals, locals: bundle.data, options: bundle.options })))
      result = result.concat(entry)
    }
    // 3) Return accumulated result.
    return result
  }, [])
  return bundle
}

function isGitRepo (input = '') {
  if (typeof input !== 'string') return false
  return input.indexOf('http://') === 0 ||
    input.indexOf('https://') === 0 ||
    input.indexOf('gh:') === 0 ||
    input.indexOf('git@') === 0
}

function resolveGitRepo (input = '', options = {}) {
  // Convert github to proper URL syntax.
  if (input.indexOf('gh:') === 0) {
    input = input.slice(3).split('@')
    if (input.length === 1) input = `https://github.com/${input[0]}.git`
    else if (input.length === 2) input = `https://${input[0]}@github.com/${input[1]}.git`
    else if (input.length > 2) {
      const len = input[0].length
      input = `https://${input[0]}@github.com/${input.join('@').slice(len)}.git`
    }
  }
  // Clone repo to `.repos` and return local repo path.
  const localPath = path.join('.repos', path.basename(input).replace('.git', ''))
  const exec = require('child_process').execSync
  fs.ensureDirSync('.repos')
  fs.removeSync(localPath)
  exec(`git clone ${input} ${localPath}`)
  return globby.sync(localPath, options.glob)
}

function readFile (filepath, { globals, locals, options = {} } = {}) {
  const file = {}
  const inputIsContent = filepath instanceof Object
  file.source = inputIsContent ? matter(filepath.content, options) : matter.read(filepath, options)
  file.source.path = inputIsContent ? filepath.path : path.normalize(filepath)
  file.content = file.source.content
  if (file.content.indexOf('\n') === 0) file.content = file.content.slice(1)
  // Merge data.
  file.data = file.source.data
  file.data = merge(
    {},
    file.source.data,
    typeof globals === 'function' ? globals(file) : globals || {},
    typeof locals === 'function' ? locals(file) : locals || {}
  )
  return file
}

function resolveBundler (bundler) {
  // Normalize bundler to an Object: { run }.
  if (!(bundler instanceof Object) || bundler.constructor !== Object) bundler = { run: bundler }
  bundler._meta = bundler._meta || {}
  bundler._meta.isValid = true
  bundler.success = false

  // Validate bundler.run.
  if (typeof bundler.run === 'function') return bundler
  if (!bundler.run || typeof bundler.run !== 'string') {
    bundler._meta.isValid = false
    return bundler
  }

  // If bundler.run is a relative path, resolve the path.
  if (bundler.run.indexOf('./') === 0 || bundler.run.indexOf('../') === 0) {
    bundler.run = path.resolve(bundler.run)
  }

  // Check for prefixed `bundles-` version of the module. If it doesn't exist, use given path.
  if (path.basename(bundler.run).indexOf('bundles-') === -1) {
    const prefixedPath = path.join(path.dirname(bundler.run), 'bundles-' + path.basename(bundler.run))
    try {
      if (require.resolve(prefixedPath)) bundler.run = prefixedPath
    } catch (error) {}
  }

  // Require module.
  try {
    bundler.run = require(bundler.run)
  } catch (error) {
    bundler._meta.isValid = false
    errors.push(error)
    return bundler
  }

  // At this point if bundler.run is not a function, skip it.
  if (typeof bundler.run !== 'function') {
    bundler._meta.isValid = false
  }

  // Return the bundler Object.
  return bundler
}

function isValidBundle (bundle = {}) {
  return bundle instanceof Object &&
    (bundle.input instanceof Array) &&
    (bundle.input.every(input => typeof input === 'string' || (typeof input === 'object' && input.constructor === Object))) &&
    (bundle.bundlers instanceof Array) &&
    bundle.bundlers.length &&
    bundle.bundlers.some(bundler => bundler._meta.isValid)
}

function throwError (error = 'Uh oh...') {
  throw new Error(error)
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

bundles.run = runBundle
bundles.resolveBundler = resolveBundler
module.exports = bundles
