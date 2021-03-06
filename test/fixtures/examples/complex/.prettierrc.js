---
metadata:
  reference: '<https://prettier.io>'
---

module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabs: false,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  overrides: [{
    files: '*.md',
    options: {
      tabWidth: 4
    }
  }]
}
