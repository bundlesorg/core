module.exports = {
  bundles: [{
    id: 'bundle1',
    input: './test/fixtures/bundlers/add-prop.js',
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
  }, {
    id: 'bundle2',
    input: './test/fixtures/simple.md',
    bundlers: [appendNewLineBundler, outputBundler]
  }]
}

function appendNewLineBundler (bundle = {}, bundler = {}) {
  return new Promise((resolve) => {
    bundle.output.forEach(file => {
      file.content = file.content += '\n'
      return file.content
    })
    return resolve(bundle)
  })
}

function outputBundler (bundle = {}, bundler = {}) {
  const fs = require('fs-extra')
  const path = require('path')
  const promises = []
  bundle.output.forEach(file => {
    promises.push(fs.outputFile(path.join('.temp', file.source.path), file.content))
  })
  return Promise.all(promises).then(() => bundle)
}
