// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import chokidar from 'chokidar'
import log from 'loglevel'
import path from 'path'

const defaultEvents = {
  add: null,
  change: null,
  unlink: null,
  ready: null,
  error: (error) => {
    log.error(error)
    return error
  }
}

// -------------------------------------------------------------------------------------------------
// Methods and helper functions.
//

function createWatcher (source, options = {}, events = {}) {
  // Events can be an object dictionary, like defaultEvents, or a function, which is assigned to
  // events.change. Events is merged with defaultevents.
  if (typeof events === 'function') events = { change: events }
  events = Object.assign({}, defaultEvents, events)

  // Must have a change event.
  if (!events.change) return

  // Create the watcher and add the events.
  const watcher = chokidar.watch(source, options)
  Object.keys(events).forEach(event => {
    // eslint-disable-next-line no-prototype-builtins
    if (!defaultEvents.hasOwnProperty(event)) return
    if (typeof events[event] === 'function') watcher.on(event, events[event])
  })

  // Return the watcher.
  return watcher
}

function watchBundle (bundle) {
  bundle = bundle || this

  // Don't create watcher if it already exists.
  if (bundle.watching) return Promise.resolve(bundle)

  // Return a promise.
  return new Promise((resolve, reject) => {
    // Only watch if it's configured to be watched.
    if (!bundle.shouldWatch()) {
      if (bundle.watcher) bundle.watcher.close()
      bundle.watching = false
      return resolve(bundle)
    }

    // Create watcher.
    bundle.watcher = createWatcher(bundle.getSources(), bundle.options.chokidar, {
      add: (filepath) => bundle.watching && bundle.add(path.join(bundle.options.chokidar.cwd || '.', filepath)),
      change: (filepath) => bundle.watching && bundle.update(path.join(bundle.options.chokidar.cwd || '.', filepath)),
      unlink: (filepath) => bundle.watching && bundle.remove(path.join(bundle.options.chokidar.cwd || '.', filepath)),
      error: (error) => reject(error),
      ready: () => {
        // Flag bundle and notify user.
        bundle.watching = true
        // Call the on.watching() hook.
        if (typeof bundle.on.watching === 'function') bundle.on.watching(bundle)
        return resolve(bundle)
      }
    })

    // Watch config/data files.
    if (bundle.sources.globalData && bundle.sources.globalData.length) {
      bundle.watchDataFiles()
    }
  })
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

export {
  createWatcher,
  watchBundle
}
