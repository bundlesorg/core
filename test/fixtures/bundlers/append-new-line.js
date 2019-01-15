module.exports = (bundle = {}, bundler = {}) => {
  return new Promise((resolve) => {
    bundle.output.forEach(result => {
      result.content = result.content += '\n'
      return result.content
    })
    return resolve(bundle)
  })
}
