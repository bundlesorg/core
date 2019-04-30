const outputBundler = {
  run: '@bundles/bundles-output',
  options: {
    to: '.temp',
    root: 'test/fixtures'
  }
}

module.exports = {
  bundles: [{
    id: 'bundle1',
    input: ['./test/fixtures/simple.md'],
    bundlers: [outputBundler]
  }, {
    id: 'bundle2',
    input: ['./test/fixtures/front-matter.md'],
    bundlers: [outputBundler]
  }]
}
