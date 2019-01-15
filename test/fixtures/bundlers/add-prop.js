module.exports = (bundle = {}, bundler = {}) => {
  if (bundler.prop && bundler.value) bundle[bundler.prop] = bundler.value
  return bundle
}
