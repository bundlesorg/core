/*! .lintstagedrc.js | @author Brikcss <https://github.com/brikcss> | @reference <https://github.com/okonet/lint-staged> */

module.exports = {
  linters: {
    '{lib,bin,esm,browser,umd}/*.js': ['npx node-minify --compressor uglify-es --input *.js --output $1.js', 'git add'],
    '*.js': ['standard --fix', 'git add'],
    '*.json': ['prettier --parser json --write', 'git add'],
    '*.css': ['prettier --parser css --write', 'stylelint', 'git add'],
    '*.md': ['prettier --parser markdown --write', 'git add']
  },
  concurrent: true,
  globOptions: {
    matchBase: true,
    dot: true
  },
  ignore: ['*.min.{js,css}']
}
