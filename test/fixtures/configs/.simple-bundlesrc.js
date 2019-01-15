module.exports = {
  input: 'test/fixtures/simple.md',
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
}
