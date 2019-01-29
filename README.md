# Bundles Core

<!-- Shields. -->
<p>
    <!-- NPM version. -->
    <a href="https://www.npmjs.com/package/@bundles/core"><img alt="NPM version" src="https://img.shields.io/npm/v/@bundles/core.svg?style=flat-square"></a>
    <!-- NPM downloads/month. -->
    <a href="https://www.npmjs.com/package/@bundles/core"><img alt="NPM downloads per month" src="https://img.shields.io/npm/dm/@bundles/core.svg?style=flat-square"></a>
    <!-- Travis branch. -->
    <a href="https://github.com/brikcss/bundles-core/tree/master"><img alt="Travis branch" src="https://img.shields.io/travis/rust-lang/rust/master.svg?style=flat-square&label=master"></a>
    <!-- Codacy. -->
    <a href="https://www.codacy.com/app/thezimmee/bundles-core"><img alt="Codacy code grade" src="https://img.shields.io/codacy/grade/35aeb04393844d258ed971189c18bf48/master.svg?style=flat-square"></a>
    <a href="https://www.codacy.com/app/thezimmee/bundles-core"><img alt="Codacy code coverage" src="https://img.shields.io/codacy/coverage/35aeb04393844d258ed971189c18bf48/master.svg?style=flat-square"></a>
    <!-- Coveralls -->
    <a href='https://coveralls.io/github/brikcss/bundles-core?branch=master'><img src='https://img.shields.io/coveralls/github/brikcss/bundles-core/master.svg?style=flat-square' alt='Coverage Status' /></a>
    <!-- JS Standard style. -->
    <a href="https://standardjs.com"><img alt="JavaScript Style Guide" src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square"></a>
    <!-- Prettier code style. -->
    <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
    <!-- Semantic release. -->
    <a href="https://github.com/semantic-release/semantic-release"><img alt="semantic release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square"></a>
    <!-- Commitizen friendly. -->
    <a href="http://commitizen.github.io/cz-cli/"><img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square"></a>
    <!-- MIT License. -->
    <a href="https://choosealicense.com/licenses/mit/"><img alt="License" src="https://img.shields.io/npm/l/express.svg?style=flat-square"></a>
    <!-- Greenkeeper. -->
    <a href="https://greenkeeper.io/"><img src="https://badges.greenkeeper.io/brikcss/bundles-core.svg?style=flat-square" alt="Greenkeeper badge"></a>
</p>

Bundles is a file bundler, similar to [WebPack](https://webpack.js.org/), [RollupJS](http://rollupjs.org), [Parcel](https://parceljs.org/), [PostCSS](https://postcss.org/), etc., **except that while other bundlers are designed to compile to a specific type of output (like JS, CSS, etc.), Bundles can compile from anything, to anything!** Bundles has no assumptions and places no limitations on the type of input it takes and what it outputs to. It simply takes input, runs it through a series of "bundlers" (i.e., simple JS plugins), and processes your data however you tell it to. Use Bundles to compile literally _anything your heart desires (and can dream up)_!

## Environment support

| Node | CLI | ES Module | Browser | UMD |
| :--: | :-: | :-------: | :-----: | :-: |
|  ✓   |  ✓  |     x     |    x    |  x  |

## Terminology

To provide clarity, the following terms are used as follows:

- _Bundles_ (capitalized): The core package / tool for Bundles.
- _bundles_: Results compiled by Bundles. More specifically this refers to the `results.bundles` returned by `Bundles`. This may also refer to `config.bundles`, which eventually turns into `results.bundles`.
- _bundle (noun)_: A single or specific result compiled by Bundles. An item in the `results.bundles` Array (i.e., `results.bundles[n]`). `bundle` may also refer to the command which runs Bundles on the CLI.
- _bundle (verb)_: The process of running input through a series of `bundlers` to achieve a desired output. `bundle` on the CLI is also an alias to
- _bundler_: A simple JavaScript function which Bundles uses to process / compile input however you like. Without `bundlers`, Bundles will simply output source input. With `bundlers`, Bundles can output just about anything you want.
- _config_: Refers to user configuration.
  - _global config_: Refers to the global `config` Object.
  - _bundles config_: Refers to `config.bundles`.
  - _bundle config_: Refers to a specific bundle, i.e., `config.bundles[n]`.

## Install

It is recommended to install bundles globally:

```sh
npm install @bundles/core -g
```

Though you can install as a local dependency:

```sh
npm install @bundles/core -D
```

## Usage

Bundles can be run in Node:

**Node:**

```js
const bundle = require('@bundles/core');
bundle(config, options);
```

Or on the command line with the `bundle` command:

**CLI:**

```sh
bundle <path/to/config/file> [options]
```

_Note: All runtime `options` get merged down to `config.options`. `options` only exists separate from `config.options` to allow user to pass runtime options (i.e., the `watch` flag), which override `config.options`._

## Configuration

Bundles' API is designed to be as minimal as possible so as to be easy to use, while also retaining a reasonable amount of flexibility. It is intended that most configuration can and should come from bundlers.

- **`bundles`** (_required_) _{Object[]}_ Bundle configuration Objects which determine how each bundle is to be processed. Each `bundle` has the following properties:

  - **`input`** (_required_) _{String|Glob}_ Input files to process.
  - **`bundlers`** (_required_) _{String[]|Function[]|Object[]}_ Each bundler processes or compiles the content and/or data from `input` in a specified way. See [bundler Objects](#bundler-objects).
  - **`id`** _{String}_ ID / identifier for this bundle. If this doesn't exist, Bundles will use its index position in `bundles`.

- **`options`** _{Object}_ Configuration options. _IMPORTANT: Any `options` passed to Bundles -- either from the command line or in Node -- get merged here._

  - **`bundles` (`--bundles` or `-B`)** _{String|Array}_ Should be a comma-separated list or an Array of bundle IDs. This option tells Bundles which bundles to run. It allows you to only run a selected number of bundles rather than all that are configured.
  - **`watch` (`--watch` or `-W`)** _{Boolean|String}_ Set `true` to watch all bundles. Pass a comma-separated String to only watch the bundle IDs listed.
  - **`loglevel` (`--loglevel` or `-L`)** _{String}_ Determines how to log information. Can be 'trace', 'debug', 'info', 'warn', 'error', or 'silent'.
  - **`glob` (`--glob` or `-G`)** _{Object}_ Options passed directly to [globby](https://github.com/sindresorhus/globby).
  - **`frontMatter` (`--front-matter` or `-M`)** _{Object}_ Options passed directly to [gray-matter](https://github.com/jonschlinkert/gray-matter).
  - **`chokidar` (`--chokidar` or `-C`)** _{Object}_ Options passed directly to [chokidar](https://github.com/paulmillr/chokidar).

### The Command Line

Bundles is designed to be run with a config file. However, as documented above, the CLI executable supports passing properties in `config.options` as flags at runtime. If the property is a Boolean, the existence of the flag will set the option to `true`. If the property is an Object, it must be a JSON string, which uses `JSON.parse()` to parse it.

### The Bundle Object

It is important to understand the `bundle` Object in order to grasp how Bundles, and bundler plugins, work. Each `bundle` contains the following properties:

- **`id`** _{String}_ The bundle ID. Defaults to its index position.
- **`input`** _{String[]}_ Array of input file paths (Strings) returned by [globby](https://github.com/sindresorhus/globby).
- **`output`** _{Object[]}_ Each Object is a file Object with the following properties:
  - **`source`** _{Object}_ The source file is read in and this `source` Object created by [gray-matter](https://www.npmjs.com/package/gray-matter). _These properties should not be modified._ `source` contains the following properties (along with all other properties [returned by gray-matter](https://www.npmjs.com/package/gray-matter#returned-object)):
    - **`path`** _{String}_ Source file path.
    - **`content`** _{String}_ Source content (should not be modified).
    - **`data`** _{String}_ Source front matter data (should not be modified).
  - **`content`** _{String}_ Output content (can be modified).
  - **`data`** _{String}_ Output front matter data (can be modified).
- **`bundlers`** _{Object[]}_ A bundler is a plugin that processes/compiles content/data. See [bundler Objects](#bundler-objects).
- **`watch`** _{Boolean}_ Whether this bundle is configured to be watched.
- **`on`** _{Object}_ Callback functions to hook into core functionality.

### Bundler Objects

A bundler is a JavaScript plugin that processes content and/or data from `config.input`. A bundler can be configured any of the following ways:

- A Function: `(bundle = {}, bundler = {}) => { // Do something cool. }`.
- A Node module: `'my-cool-bundler'` or `'./path/to/bundler'`
- An Object, where the `run` property is a Node module or a Function. This allows you to attach bundler specific configuration.

During runtime, each bundler is normalized to an Object with the following properties:

- **`success`** _{Boolean}_ Whether the bundler ran successfully.
- **`error`** _{Error}_ Error Object if an error occurs running the bundler.
- **`run`** _{Function}_ The bundler Function which processes the bundle. If it is a node module it is the default export for that module, which must be a function.
- **`_meta`** _{Object}_ Private metadata about the bundler.

**Other properties are typically available to allow users to configure each bundler. Make sure to read documentation for each bundler for how to configure them.**

### The Result Object

Upon completion (i.e., after running all bundlers), Bundles returns a result Object similar to the original `config` Object. The result Object has the following useful properties:

- **`success`** _{Boolean}_ Whether all bundles compiled successfully.
- **`bundles`** _{Object[]}_ Bundles that ran. Each bundle Object has the following properties:
  - **`success`** _{Boolean}_ Whether bundle compiled successfully.
  - **`output`** _{Object[]}_ File(s) to output.
  - **`watch`** _{Boolean}_ Whether the bundle is being watched.
  - **`_meta`** _{Object}_ Metadata used internal.
- **`bundlesMap`** _{Object}_ Dictionary of bundles that ran, organized by bundle ID. Provided simply for an alternative way to look up bundle results.
- **`options`** _{Object}_ Run time options, merged with configuration options.
- **`watchers`** _{Object}_ A dictionary of watchers created by [chokidar](https://github.com/paulmillr/chokidar), organized by bundle ID.
- **`on`** _{Object}_ A dictionary of configured callbacks, organized by callback name.
- **`_meta`** _{Object}_ Metadata used internally. May change at any time.

## Using bundlers

## Creating a bundler

It is easy to create your own custom bundler. A bundler is simply a function which returns the `bundle`. Here are two simple examples:

```js
const fs = require('fs');
module.exports = (bundle = {}, bundler = {}) => {
  bundle.output.forEach((result) => {
    result.content = result.content += '\n';
    return result.content;
  });
  // Must return the bundle Object.
  return bundle;
};
```

You may also return a Promise which returns the `bundle` Object:

```js
const fs = require('fs');
module.exports = (bundle = {}, bundler = {}) => {
  // Return a promise...
  return new Promise((resolve) => {
    bundle.output.forEach((result) => {
      result.content = result.content += '\n';
      return result.content;
    });
    // ...which resolves the bundle Object.
    return resolve(bundle);
  });
};
```

### Guidelines for creating a bundler

1. A bundler must return a function which returns the modified `bundle` Object. The function receives, and allows you to use, the following parameters (see examples above):

   - **`bundle`** _{Object}_ [The bundle Object](#the-bundle-object).
   - **`bundler`** _{Object}_ The bundler configuration. This allows users to provide bundler-specific configuration.
       <!-- - **`config`** _{Object}_ The global configuration Object. _IMPORTANT: This is provided for access to global user options but should not be modified._ -->

2. Only modify the `bundle` Object. Other parameters are provided as read-only context, and it is strongly encouraged not to modify these Objects.

3. Internally, the `bundler` Object only uses a few properties. This allows bundler authors flexibility in how they provide their custom set of configuration properties for their users. However, as a caution, Bundles reserves the right to add more internal properties in the future (any breaking changes, of course, will be [semantically versioned](https://semver.org/)), so bundler authors are encouraged to wrap their configuration in a single parent Object such as `options` (i.e., `bundler.options`). See [bundler Objects](#bundler-objects) for more about bundlers and their properties.
