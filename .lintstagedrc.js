/*! .lintstagedrc.js | @author brikcss <https://github.com/brikcss> | @reference <https://github.com/okonet/lint-staged> */

module.exports = {
  '!(/test/fixtures*,*.min).js': ['standard --fix', 'git add'],
  '!(/test/fixtures*,*.min).css': ['prettier --parser css --write', 'stylelint', 'git add'],
  '!(/test/fixtures*).json': ['prettier --parser json --write', 'git add'],
  '!(/test/fixtures*).md': ['prettier --parser markdown --write', 'git add']
}
