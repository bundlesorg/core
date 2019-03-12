# <%= this.pkg.name %>

<!-- Shields. -->
<p>
    <!-- NPM version. -->
    <a href="https://www.npmjs.com/package/<%= this.npm.user %>/<%= this.npm.repo %>"><img alt="NPM version" src="https://img.shields.io/npm/v/<%= this.npm.user %>/<%= this.npm.repo %>.svg?style=flat-square"></a>
    <!-- NPM downloads/month. -->
    <a href="https://www.npmjs.com/package/<%= this.npm.user %>/<%= this.npm.repo %>"><img alt="NPM downloads per month" src="https://img.shields.io/npm/dm/<%= this.npm.user %>/<%= this.npm.repo %>.svg?style=flat-square"></a>
    <!-- Travis branch. -->
    <a href="https://github.com/<%= this.github.user %>/<%= this.github.repo %>/tree/master"><img alt="Travis branch" src="https://img.shields.io/travis/rust-lang/rust/master.svg?style=flat-square&label=master"></a>
    <!-- Codacy. -->
    <a href="https://www.codacy.com"><img alt="Codacy code quality" src="https://img.shields.io/codacy/grade//master.svg?style=flat-square"></a>
    <a href="https://www.codacy.com"><img alt="Codacy code coverage" src="https://img.shields.io/codacy/coverage//master.svg?style=flat-square"></a>
    <!-- Coveralls -->
    <a href='https://coveralls.io/github/<%= this.github.user %>/<%= this.github.repo %>?branch=master'><img src='https://img.shields.io/coveralls/github/<%= this.github.user %>/<%= this.github.repo %>/master.svg?style=flat-square' alt='Coverage Status' /></a>
    <!-- JS Standard style. -->
    <a href="https://standardjs.com"><img alt="JavaScript Style Guide" src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square"></a>
    <!-- Prettier code style. -->
    <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
    <!-- Semantic release. -->
    <a href="https://github.com/semantic-release/semantic-release"><img alt="semantic release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square"></a>
    <!-- Commitizen friendly. -->
    <a href="http://commitizen.github.io/cz-cli/"><img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square"></a>
    <!-- Greenkeeper. -->
    <a href="https://greenkeeper.io/"><img src="https://badges.greenkeeper.io/<%= this.github.user %>/<%= this.github.repo %>.svg?style=flat-square" alt="Greenkeeper badge"></a>
    <!-- MIT License. -->
    <a href="LICENSE.md"><img alt="License" src="https://img.shields.io/npm/l/express.svg?style=flat-square"></a>
</p>

## Environment Support

| Node | CLI | ES Module | Browser | UMD |
| :--: | :-: | :-------: | :-----: | :-: |
| <%= this.features.node ? '✓' : 'x' %> | <%= this.features.cli ? '✓' : 'x' %> | <%= this.features.esm ? '✓' : 'x' %> | <%= this.features.browser ? '✓' : 'x' %> | <%= this.features.umd ? '✓' : 'x' %> |

## Install

```sh
npm install <%= this.npm.user %>/<%= this.npm.repo %> -D
```

## Getting Started

## Configuration / API

## Contributing

We love your contributions! [Read our Contributor's Covenant](CONTRIBUTING.md).

## License

[See License](LICENSE.md).