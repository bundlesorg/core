/*! .huskyrc.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/typicode/husky */

module.exports = {
  hooks: {
    'pre-commit': 'lint-staged',
    'commit-msg': 'commitlint -e $HUSKY_GIT_PARAMS && . ./node_modules/.bin/commit-msg-stamp-branch $HUSKY_GIT_PARAMS',
    'pre-push': '. ./node_modules/.bin/pre-push-check-stage && echo "\n[ok] Pushing code..."'
  }
}
