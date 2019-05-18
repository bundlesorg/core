const DEFAULT_TYPENAMES = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
  type: 'type'
}

/**
 * Return string representation of the true type of a value.
 *
 * @param {any} value  Value to check.
 * @return {String}  Lowercase string type.
 */
function _trueType (value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}

/**
 * Check if a given value is a primitive, which can be compared with ===.
 *
 * @param {any} value  Value to check.
 * @param {Boolean} isType  Whether value has been typed. Will run _trueType(value) if false.
 * @return {Boolean}  Whether value is a primitive data type.
 */
function _isPrimitive (value, isType) {
  return ['string', 'boolean', 'number', 'null', 'undefined'].includes(isType ? value : _trueType(value))
}

/**
 * Join parent and child object paths.
 *
 * @param {String} parent  Parent path.
 * @param {String} key  Child key/path.
 * @return {String}  String path.
 */
function _joinPath (parent, key) {
  return parent ? [parent, key].join('.') : key === undefined ? '' : key
}

/**
 * Create a diff object which can be pushed to diff results.
 *
 * @param {Object} a  Source object.
 * @param {Object} b  Target object.
 * @param {Object} [config={}]  Configuration options.
 * @param {String} config.parent  Parent path.
 * @param {String} config.key  Child/key path.
 * @param {String} config.aType  String type of a.
 * @param {String} config.bType  String type of b.
 * @param {Boolean} [config.checkTypes=true]  Whether to include 'type' value of diff.type.
 * @param {Boolean} [config.flatten=false]  Whether to flatten source type and value properties to
 *     'sourceType' and 'sourceValue'.
 * @param {String} [config.source='source']  Property name for source.
 * @param {String} [config.target='target']  Property name for target.
 * @return {Object}  Diff object with path, type, [source], and [target] properties.
 */
function _createDiff (a, b, {
  parent,
  key,
  aType,
  bType,
  isTypeDiff = false,
  checkTypes = true,
  flatten = false,
  typeNames = {},
  source = 'source',
  target = 'target'
} = {}) {
  typeNames = Object.assign({}, DEFAULT_TYPENAMES, typeNames)
  if (aType === undefined) aType = _trueType(a)
  if (bType === undefined) bType = _trueType(b)
  const diff = {
    path: _joinPath(parent, key),
    type: a === undefined ? typeNames.added : b === undefined ? typeNames.removed : typeNames.changed,
    [source]: {
      type: `<${aType}>`,
      value: a
    },
    [target]: {
      type: `<${isTypeDiff ? String(b).replace(',', '|') : bType}>`,
      value: isTypeDiff ? `<${String(b).replace(',', '|')}>` : b
    }
  }
  // 1) Determine type.
  if (isTypeDiff) {
    diff.type = typeNames.type
  } else if (checkTypes) {
    // Check if diff.type should be 'type'.
    if (a !== undefined && b !== undefined && a !== null && b !== null && aType !== bType) {
      diff.type = typeNames.type
    }
  }
  // 2) Set source and target.
  if (flatten) {
    [source, target].forEach(key => {
      diff[key + 'Type'] = diff[key].type
      diff[key + 'Value'] = diff[key].value
      delete diff[key]
    })
  }
  // 3) Return the diff.
  return diff
}

/**
 * Determines if two types are equal.
 *
 * @param {any} aType  A value or type.
 * @param {String} bType  B type.
 * @param {boolean} [isType=false]  Indicates if _trueType() has already been run on aType.
 * @return {boolean}  Whether types are equal.
 */
function _isEqualType (aType, bType, isType = false) {
  return bType.split(',').includes(isType ? aType : _trueType(aType))
}

/**
 * Parse config to set defaults.
 *
 * @param {Object} [config={}]  Configuration. All configuration that can be passed to the Diff
 *     constructor can be passed here.
 */
function _parseConfig (config = {}) {
  if (config.mode === 'expected') {
    config.source = config.source || 'received'
    config.target = config.target || 'expected'
  }
  config._parsed = true
  return config
}

/**
 * Do a "types diff", which takes a source value and a "types map" and compares the source value and
 * its properties with the corresponding types contained in the types map.
 *
 * @param {any} a  Source value.
 * @param {any} b  Types map. This should be a "types map", where all values are string
 *     representations of the type to compare with the corresponding source properties.
 * @param {Object} [config={}]  Configuration. All configuration that can be passed to the Diff
 *     constructor can be passed here. Additionally, the following properties are used internally:
 * @param {String} [config.aType]  Used internally. Cached a type.
 * @param {String} [config.bType]  Used internally. Cached b type.
 * @param {String} [config.parent]  Used internally. Cached parent path.
 * @param {String} [config.key]  Used internally. Cached child/key path.
 * @return {Array}  Array of diff objects, if any diffs exist, or empty Array.
 */
function typesDiff (a, b, config = {}) {
  if (!config._parsed) config = _parseConfig(config)
  // Setup.
  config.isTypeDiff = true
  const aType = _trueType(a)
  const bType = _trueType(b)

  // B must be a type map.
  if (bType !== 'object' && bType !== 'array' && _isPrimitive(bType, true) && bType !== 'string') {
    return [_createDiff(a, b, config)]
  }
  // If A is a primitive, check it.
  if (_isPrimitive(aType) && bType === 'string') {
    return _isEqualType(aType, b, true) ? [] : [_createDiff(a, b, config)]
  }
  // We can assume A is an object or array we can iterate through. Let's grab the array or object's
  // keys and iterate through.
  const isArray = aType === 'array'
  const keys = isArray ? a.concat(b) : [...new Set(Object.keys(a).concat(Object.keys(b)))]
  return keys.reduce((result, key, i) => {
    // Set values based on whether we're working with an object or array.
    const aValue = isArray ? a[i] : a[key]
    const bValue = isArray ? b[i] : b[key]
    config.key = isArray ? i.toString() : key
    const aType = _trueType(aValue)
    const bType = _trueType(bValue)
    // When in 'expected' mode, ignore undefined values in b.
    if (config.mode === 'expected' && bValue === undefined) return result
    // If the type map has a string, it expects a type value at the given path, so check A's type.
    if (bType === 'string') {
      if (!_isEqualType(aType, bValue, true)) {
        result.push(_createDiff(aValue, bValue, config))
      }
      return result
    }
    // If type map has an object or array, keep iterating through to check its children.
    if (bType === 'object' || bType === 'array') {
      return result.concat(typesDiff(aValue, bValue, { parent: _joinPath(config.parent, config.key) }))
    }
    return result
  }, [])
}

/**
 * Diff two values.
 *
 * @param {any} a  Source value.
 * @param {any} b  Target value.
 * @param {Object} [config={}]  Configuration. All configuration that can be passed to the Diff
 *     constructor can be passed here.
 * @param {String} [config.aType]  Used internally. Cached a type.
 * @param {String} [config.bType]  Used internally. Cached b type.
 * @param {String} [config.parent]  Used internally. Cached parent path.
 * @param {String} [config.key]  Used internally. Cached child/key path.
 * @return {Array}  Array of diff objects, if any diffs exist, or empty Array.
 */
function diff (a, b, config = {}) {
  if (!config._parsed) config = _parseConfig(config)
  if (config.typesMap) {
    const valueDiffs = diff(a, b, Object.assign({}, config, { typesMap: undefined, checkTypes: true }))
    const typeDiffs = typesDiff(a, config.typesMap, config).filter(td => {
      return !valueDiffs.find(vd => vd.path === td.path)
    })
    return typeDiffs.concat(valueDiffs)
  }
  // Setup.
  const aType = _trueType(a)
  const bType = _trueType(b)
  // If the types are unequal, create and return a diff.
  if (aType !== bType) {
    return [_createDiff(a, b, config)]
  }
  // We can now assume types are equal, so we only need to check A. If A is a
  // primitive/non-iterable, check its equality and return either an empty diffs array or a diff.
  if (_isPrimitive(aType, true)) {
    return a === b ? [] : [_createDiff(a, b, config)]
  }
  // We can now assume we're working with an object or array. Grab the keys and iterate.
  const isArray = aType === 'array'
  const keys = isArray ? a.concat(b) : [...new Set(Object.keys(a).concat(Object.keys(b)))]
  return keys.reduce((result, key, i) => {
    // Set values based on whether we're working with an object or array.
    const aValue = isArray ? a[i] : a[key]
    const bValue = isArray ? b[i] : b[key]
    config.aType = _trueType(aValue)
    config.bType = _trueType(bValue)
    config.key = isArray ? i.toString() : key

    // When in 'expected' mode, ignore undefined values in b.
    if (config.mode === 'expected' && bValue === undefined) return result

    // If A/B types are different, add a diff and return the result.
    if (config.aType !== config.bType) {
      result.push(_createDiff(aValue, bValue, config))
      return result
    }

    // If value is a primitive, check its equality and return the result.
    if (_isPrimitive(config.aType, true)) {
      if (aValue !== bValue) {
        result.push(_createDiff(aValue, bValue, config))
      }
      return result
    }

    // Check the equality of other non-iterable data types and return the result.
    if (['function', 'symbol', 'date'].includes(config.aType)) {
      if (aValue.toString() !== bValue.toString()) {
        result.push(_createDiff(aValue, bValue, config))
      }
      return result
    }

    // If the value is iterable, recursively iterate and concatenate results.
    if (config.aType === 'array' || config.aType === 'object') {
      return result.concat(diff(aValue, bValue, Object.assign(
        {},
        config,
        { parent: _joinPath(config.parent, config.key) }
      )))
    }

    return result
  }, [])
}

/**
 * Utility to create preconfigured. This allows user to create a preconfigured Diff object that runs the same each time.
 *
 * @class Diff
 * @param {Object} [config={}]  Diff configuration.
 * @param {String} [config.mode]  Mode to run in. 'expected' will ignore diffs where a B value is
 *     undefined.
 * @param {Boolean} [config.flatten=false]  Whether to flatten source/target type and value
 *     properties to 'sourceType', 'sourceValue' and 'targetType', 'targetValue'.
 * @param {Boolean} [config.checkTypes=true]  Whether to include the 'type' type. If false, when
 *     types do not match will instead be type='changed'.
 * @param {String} [config.source='source']  Property name to use for the source value.
 * @param {String} [config.target='target']  Property name to use for the target value.
 * @param {String} [config.parent='']  Sets the initial root path.
 * @param {Object} [config.typesMap]  When provided with the main diff method, a typesDiff is run
 *     along with the main value diff, and both type and value diffs are returned, though duplicate
 *     paths are removed, with the value diff overriding any type diff. A types map simply contains
 *     string values, where each string represents the type for a given path, which path is compared
 *     to the A value's type at the given path. A types map can be a nested object or array, and
 *     each string can be a comma-separated list (no spaces) to support multiple expected/allowed
 *     types.
 * @param {Object} [config.typeNames=DEFAULT_TYPENAMES]  Default type labels for the diff.type
 *     property. Defaults to { added: 'added', removed: 'removed', changed: 'changed', type: 'type'
 *     }. Any value provided is merged with the defaults.
 */
function differ (config = {}) {
  if (!config._parsed) config = _parseConfig(config)
  const fn = (a, b, extendedConfig = {}) => diff(a, b, Object.assign({}, config, extendedConfig))
  fn.types = (a, b, extendedConfig = {}) => typesDiff(a, b, Object.assign({}, config, extendedConfig))
  return fn
}

export default diff
export { differ, diff, typesDiff }
