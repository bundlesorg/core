const run = require('./.bundles-data.js')
const data = {}

// -------------------------------------------------------------------------------------------------
// Template and features to include.
//

data.author = 'Brikcss <https://github.com/brikcss>'
// Can be: node | cli | esm | browser | umd
data.template = 'browser'

// Only modify features if you want to force override template settings.
data.features = {
  node: true,
  cli: true,
  browser: true,
  esm: true,
  umd: true,
  rollup: undefined,
  minify: undefined,
  css: undefined,
  shots: undefined,
  jest: undefined
}

// -------------------------------------------------------------------------------------------------
// Basic package metadata.
//

// NPM package user/id.
data.npm = {
  user: '@brikcss',
  repo: 'browser-module'
}

// GitHub repo user/id.
data.github = {
  // Only override if different from npm.user.
  user: 'brikcss',
  // Only override if different from npm.repo.
  repo: data.npm.repo
}

// Package.json details.
data.pkg = {
  name: (data.npm.user[0] === '@' ? data.npm.user + '/' : '') + data.npm.repo,
  version: '0.0.1',
  description: 'Starter Browser module.',
  keywords: [
    'bundles',
    'bundle',
    'module',
    'starter',
    'node'
  ],
  license: 'MIT',
  contributors: ['Zimmee <thezimmee@gmail.com>']
}

// -------------------------------------------------------------------------------------------------
// Dependencies.
// -------------
// Only add dependencies here if you want to force override the defaults in .bundles-data.js, or if
// you want to add some that aren't listed there.
//

data.pkg.dependencies = {}
data.pkg.devDependencies = {}

// -------------------------------------------------------------------------------------------------
// NPM Scripts.
// ------------
// Only add scripts here if you want to force override the defaults in .bundles-data.js, or if you
// want to add some that aren't listed there.
//

data.pkg.scripts = {}

// -------------------------------------------------------------------------------------------------
// Exports.
// --------
//

module.exports = run(data)
