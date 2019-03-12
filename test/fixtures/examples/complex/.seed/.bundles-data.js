// -------------------------------------------------------------------------------------------------
// Exports.
//

module.exports = (data) => {
  // -------------------------------------------------------------------------------------------------
  // Features to include.
  //

  data.features = data.features || {}

  if (data.features.node === undefined) {
    data.features.node = data.template === 'node'
  }
  if (data.features.cli === undefined) {
    data.features.cli = data.template === 'cli'
  }
  if (data.features.browser === undefined) {
    data.features.browser = data.template === 'browser'
  }
  if (data.features.esm === undefined) {
    data.features.esm = data.template === 'esm'
  }
  if (data.features.umd === undefined) {
    data.features.umd = data.template === 'umd'
  }

  data.features.minify = true
  data.features.jest = true
  if (data.features.css === undefined) {
    data.features.css = data.template === 'browser' || data.features.browser
  }
  if (data.features.ejs === undefined) {
    data.features.ejs = data.template === 'browser' || data.features.browser
  }
  if (data.features.shots === undefined) {
    data.features.shots = data.template === 'browser' || data.features.browser
  }
  if (data.features.rollup === undefined) {
    data.features.rollup = ['esm', 'browser', 'umd'].includes(data.template) || data.features.browser || data.features.esm || data.features.umd
  }

  // -------------------------------------------------------------------------------------------------
  // Package.json - basic metadata.
  //

  // Set default pkg props to sort them properly.
  data.pkg = data.pkg || {}

  // Set NPM defaults.
  data.npm = Object.assign({
    user: '@brikcss',
    repo: ''
  }, data.npm)
  // Set GitHub defaults.
  data.github = Object.assign({
    user: data.npm.user || 'brikcss',
    repo: data.npm.repo || ''
  }, data.github)

  // Set package fields.
  data.pkg.name = (data.npm.user[0] === '@' ? data.npm.user + '/' : '') + data.npm.repo
  data.pkg.author = `${data.github.user.charAt(0).toUpperCase() + data.github.user.slice(1)} <https://github.com/${data.github.user}>`
  if (!data.pkg.homepage) {
    if (data.github) data.pkg.homepage = `https://github.com/${data.github.user}/${data.github.repo}`
    else if (data.npm) data.pkg.homepage = `https://npmjs.com/package/${(data.npm.user.charAt(0) === '@' ? data.npm.user + '/' : '') + data.npm.repo}`
  }
  if (data.github) {
    data.pkg.homepage = `https://github.com/${data.github.user}/${data.github.repo}`
    data.pkg.repository = {
      type: 'git',
      url: `https://github.com/${data.github.user}/${data.github.repo}.git`
    }
  }
  data.pkg.bugs = `https://github.com/${data.github.user}/${data.github.repo}/issues`

  // -------------------------------------------------------------------------------------------------
  // Package.json - library files.
  //

  // Library files.
  const filesMap = {
    main: {
      feature: 'node',
      dir: 'lib'
    },
    bin: {
      feature: 'cli',
      dir: 'bin'
    },
    module: {
      feature: 'esm',
      dir: 'module'
    },
    browser: {
      feature: 'browser',
      dir: 'browser'
    },
    umd: {
      feature: 'umd',
      dir: 'umd'
    }
  }
  data.pkg.main = filesMap.main.dir + '/' + data.npm.repo
  data.pkg.files = Object.keys(filesMap).reduce((files, key, i) => {
    if (data.features[filesMap[key].feature]) {
      files.push(filesMap[key].dir)
      data.pkg[key] = filesMap[key].dir + '/' + data.npm.repo
    }
    return files
  }, [])
  data.pkg.publishConfig = {
    tag: 'dev',
    access: 'public'
  }

  // -------------------------------------------------------------------------------------------------
  // Package.json - dependencies and scripts.
  //

  let devDependencies = data.pkg.devDependencies || {}
  let dependencies = data.pkg.dependencies || {}
  let scripts = data.pkg.scripts || {}
  // Create method to add/append scripts.
  scripts.add = (prop = '', string = '', combinator = ' && ') => {
    if (!scripts[prop]) scripts[prop] = string
    else if (!scripts[prop].includes(string)) scripts[prop] += combinator + string
    return scripts[prop]
  }

  // Git and linting features.
  devDependencies['@brikcss/git-hooks'] = '*'
  // Rollup and Babel.
  if (data.features.rollup) {
    devDependencies['@babel/preset-env'] = '*'
    devDependencies['rollup'] = '*'
    devDependencies['rollup-plugin-commonjs'] = '*'
    devDependencies['rollup-plugin-node-resolve'] = '*'
    devDependencies['rollup-plugin-terser'] = '*'
    devDependencies['rollup-plugin-babel'] = '*'
    devDependencies['semantic-release'] = '*'
    scripts.add('build', 'rollup --config=.rolluprc.js')
    scripts.add('watch', '"npm run build -- --watch"', ' ')
  }
  // Browser UI testing and dev server.
  if (data.features.browser) {
    devDependencies['browser-sync'] = '*'
    devDependencies['@brikcss/shots'] = '*'
    scripts.add('test', 'npx shots')
    scripts.add('watch', '"browser-sync start --config ./.browsersyncrc.js"', ' ')
  }
  // Unit testing.
  if (data.features.jest) {
    devDependencies['codacy-coverage'] = '*'
    devDependencies['coveralls'] = '*'
    devDependencies['jest'] = '*'
    scripts.add('lint', 'standard *.js')
    scripts.add('test', 'npm run unit -- --coverage && cat coverage/lcov.info | codacy-coverage && cat coverage/lcov.info | coveralls')
    scripts.add('unit', 'jest --config .jestrc.js')
    scripts.add('watch', '"npm run unit -- --watchAll"', ' ')
  }
  // CSS processing.
  if (data.features.css) {
    devDependencies['@brikcss/stylelint-config-css'] = '*'
    devDependencies['@bundles/bundles-postcss'] = '*'
    devDependencies['@bundles/core'] = '*'
    devDependencies['autoprefixer'] = '*'
    devDependencies['colorguard'] = '*'
    devDependencies['css-mqpacker'] = '*'
    devDependencies['focus-within'] = '*'
    devDependencies['postcss'] = '*'
    devDependencies['postcss-csso'] = '*'
    devDependencies['postcss-reporter'] = '*'
    scripts.add('build', 'bundle')
  }
  // Tplit templating.
  if (data.features.tplit) {
    devDependencies['@bundles/bundles-output'] = '*'
    devDependencies['@bundles/bundles-tplit'] = '*'
    devDependencies['@bundles/core'] = '*'
    scripts.add('build', 'bundle')
  }

  // Complete watch script.
  if (scripts.watch) {
    scripts.watch = 'concurrently ' + scripts.watch
    devDependencies['concurrently'] = '*'
  }
  // Add prebuild script.
  if (scripts.build) {
    devDependencies['rimraf'] = '*'
    scripts.add('prebuild', `rimraf {${Object.keys(data.pkg.files).join(',')}}`)
  }
  // Add pretest script.
  if (scripts.test && scripts.build) {
    scripts.add('pretest', 'npm run build')
  }
  // Add start script.
  if (scripts.watch || scripts.test || scripts.build) {
    scripts.add('start', scripts.watch ? 'npm run watch' : scripts.test ? 'npm test' : scripts.build ? 'npm run build' : '')
  }
  // Add tasks separator.
  scripts.add('// TASKS', '')

  // Remove add method.
  delete scripts.add
  // Sort scripts and dependencies.
  data.pkg.devDependencies = sortObject(devDependencies)
  data.pkg.dependencies = sortObject(dependencies)
  data.pkg.scripts = sortObject(scripts, ['start', 'pretest', 'test', 'prebuild', 'build', 'watch', '// TASKS'])

  // Sort pkg.
  data.pkg = sortObject(data.pkg, [
    'name',
    'version',
    'description',
    'files',
    'main',
    'bin',
    'module',
    'browser',
    'umd',
    'dependencies',
    'devDependencies',
    'scripts',
    'keywords',
    'author',
    'contributors',
    'license',
    'homepage',
    'bugs',
    'repository',
    'publishConfig'
  ])

  // -------------------------------------------------------------------------------------------------
  // Helper functions.
  //

  function sortObject (obj = {}, sortedKeys = []) {
    const newObj = {}
    sortedKeys = sortedKeys.length ? [...new Set(sortedKeys.concat(Object.keys(obj)))] : Object.keys(obj).sort()
    sortedKeys.forEach(id => {
      newObj[id] = obj[id]
    })
    return newObj
  }

  return data
}
