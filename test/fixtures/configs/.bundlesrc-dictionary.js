module.exports = {
  bundle1: {
    input: './test/fixtures/simple.md',
    bundlers: [
      (bundle = {}) => {
      // Return a promise with a timeout to ensure this bundle always finishes first.
        return new Promise((resolve) => {
          setTimeout(() => {
            bundle.testing = 'test'
            bundle.array = [1]
            return resolve(bundle)
          }, 20)
        })
      },
      (bundle = {}) => {
      // Push to `array` prop created in previous bundle to ensure correct order.
        bundle.array.push(2)
        return bundle
      }
    ]
  },
  bundle2: {
    input: './test/fixtures/simple.md',
    bundlers: [appendNewLineBundler, { run: addPropBundler, prop: 'test', value: 'ing' }]
  } }

function appendNewLineBundler (bundle = {}, bundler = {}) {
  return new Promise((resolve) => {
    bundle.output.forEach(result => {
      result.content = result.content += '\n'
      return result.content
    })
    return resolve(bundle)
  })
}
function addPropBundler (bundle = {}, bundler = {}) {
  if (bundler.prop && bundler.value) bundle[bundler.prop] = bundler.value
  return bundle
}
