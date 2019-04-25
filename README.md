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
|  ✓   |  ✓  |     ✓     |    x    |  x  |

## Terminology

To provide clarity, the following terms are used as follows:

-   _Bundles_ (capitalized): The core package / tool for Bundles.
-   _bundles_: Results compiled by Bundles. More specifically this refers to the `results.bundles` returned by `Bundles`. This may also refer to `config.bundles`, which eventually turns into `results.bundles`.
-   _bundle (noun)_: A single or specific result compiled by Bundles. An item in the `results.bundles` Array (i.e., `results.bundles[n]`). `bundle` may also refer to the command which runs Bundles on the CLI.
-   _bundle (verb)_: The process of running input through a series of `bundlers` to achieve a desired output. `bundle` on the CLI is also an alias to
-   _bundler_: A simple JavaScript function which Bundles uses to process / compile input however you like. Without `bundlers`, Bundles will simply output source input. With `bundlers`, Bundles can output just about anything you want.
-   _config_: Refers to user configuration.
    -   _global config_: Refers to the global `config` Object.
    -   _bundles config_: Refers to `config.bundles`.
    -   _bundle config_: Refers to a specific bundle, i.e., `config.bundles[n]`.

## Install

Install globally:

```sh
npm install @bundles/core -g
```

or locally:

```sh
npm install @bundles/core -D
```

## Setup

**Node:**

```js
const bundle = require('@bundles/core');
bundle(config, options);
```

**CLI:**

```sh
bundle --config=<path/to/config/file> [options]
# Or:
bundle <paths/to/input/files> [options]
```

_NOTE: Bundles is designed to be run with a config file. However, as documented below, the CLI executable supports passing certain `config.options` properties as flags at CLI runtime. All runtime `options` are merged down to `config.options`._

## API

### **`Bundles(config, options)`** or **`Bundles.run(config, options)`** <a name="bundles-method"></a>

#### Parameters

-   `config` _(Array|Object|String)_ Bundles configuration. See [the config parameter](#the-config-parameter).
-   `options` _(Object)_ Global options which get merged to each [`bundle.options`](#the-bundle-object).

#### Returns

The [result Object](#bundles-result).

### **`Bundles.result`** <a name="bundles-result"></a>

When initialized, Bundles creates a global `result` Object, which is later returned by [the main Bundles method](#bundles-method). It contains the following properties:

-   `success` _{Boolean}_ Whether all bundles completed successfully.
-   `errors` _{Array}_ Array of any errors encountered by Bundles.
-   `watching` _{Boolean}_ Whether Bundles is watching any bundles.
-   `config`: _{Object}_ Original [`options` object](#the-bundle-object) passed by user (same properties exist), with an additional `path` property which contains the config file path, if a config file was used.
-   `bundles` _{Object[]}_ Compiled bundles, each with:
    -   `success` _{Boolean}_ Whether bundle compiled successfully.
    -   `id` _{String}_ Bundle ID.
    -   `input` _{Array}_ Source input Strings and/or Objects.
    -   `output` _{Object[]}_ An Array of [`File` Objects](#the-file-object), each of which contain source content and data, as well as output content and data.
    -   `watcher` _{Object}_ Watcher from [chokidar](https://github.com/paulmillr/chokidar), if watching files.
    -   `_meta` _{Object}_ Metadata used internally.
-   `bundlesMap` _{Object}_ Dictionary of bundles that ran, organized by bundle ID. Provided simply for an alternative way to look up bundle results.

## Configuration

### The `config` parameter

Configuration is passed through the `config` parameter, and can come from a config file or passed directly. The `config` parameter determines [configuration for Bundle Objects](#the-bundle-object), and can passed in any of the following ways:

-   **Config filepath String or Lookup**: If a String is falsy value is provided, Bundles will import the config file at the given path, or search one named `bundlesrc.{js,json,yml}`. Based on what it exports, the config file will be treated as described below.

-   **Bundles Array**: Bundles will treat an Array `config` as an Array of [Bundle Objects](#the-bundle-object).

    ```js
    // Configures an Array of bundles.
    module.exports = [{...}, {...}]
    ```

-   **Bundle Object**: If `config` is an Object _and has `input` and `bundlers` properties_, it will be treated as a single [Bundle Object](#the-bundle-object).

    ```js
    // Configures a single bundle.
    module.exports = {
        input: [...],
        bundlers: [...]
    }
    ```

-   **Global Config**: If `config` is an Object _and has the `bundles` property_, Bundles will treat it as a global config Object. The `bundles` property will be treated as one or more [Bundle Objects](#the-bundle-object), while other properties -- such as `options` and `data` -- will be merged with each bundle.

    ```js
    // Configures one or more bundles with global options and data that will
    // be merged with each bundle.
    module.exports = {
        bundles: [{...}, {...}],
        options: {...},
        data: {...}
    }
    ```

-   **Bundles Dictionary Object**: If `config` is an Object _but does not meet any of the above criteria_, it will be treated as a dictionary / map of [Bundles Objects](#the-bundle-object), where each key will be assigned as the `bundle.id`, and each child Object is the config for that bundle. For example:

    ```js
    // Configures one or more bundles with an ID, in this example, of bundle1
    // and bundle2.
    module.exports = {
        bundle1: {...},
        bundle2: {...}
    }
    ```

### The `Bundle` Object

The `Bundle` Object is the central configuration piece in Bundles. Each Bundle tells Bundles 1) what to bundle, and 2) how to bundle it. A `Bundle` consists of the following properties:

-   `id` _{String}_ The bundle ID is used only for logging purposes. If not provided, Bundles will use assign the bundle's index position as its ID.

-   `input` (_required_) _{Array|String|Object}_ Each source input tells Bundles _what to compile_ and can be any of the following.

    -   **Local file path or glob**: Bundles treats each input String as a source file path or glob, unless it is a git repo (see below). All file paths and globs are processed with [globby](https://github.com/sindresorhus/globby).
    -   **Git repo URL**: Bundles will automatically detect if a String is a git repo, in which case Bundles will clone it locally (to `.repos`) and use the local repo directory for the bundle's source input. The proper syntax for git repos are any URL that starts with `http://`, `https://`, `git@`, or for an alternative shorthand to GitHub repos, you may use: `gh:<github-id>/<repo>`.
    -   **Content Object**: Use an Object to pass source input content directly (as opposed to Bundles reading the source file). Each Object requires a `content` property, for the source content, and a `path` property for the presumed source path. _IMPORTANT: Even though Bundles does not access the source `path`, it is needed so Bundles (and bunders) can understand where the file is intended to be output to._
    -   **Array Mixture**: The `input` property will accept an Array of any combination of the above data types.

-   `bundlers` (_required_) _{Function[]|Object[]|String[]}_ An Array of bundlers, each which process `bundle.input` and turn it into output. A Bundler can be a Function, Object, or String. For example:

    ```js
    bundlers: [
        // Object. This offers most flexibility since you can pass bundler
        // specific configuration.
        {
            run: (bundle, bundler) => bundle,
            // Other configuration properties go here.
        },
        // Object. This offers most flexibility since you can pass bundler
        // specific configuration.
        {
            run: 'my-npm-or-local-module',
            // Other configuration properties go here.
        },
        // Function.
        (bundle, bundler) => bundle,
        // Node required module.
        'my-npm-or-local-module',
    ];
    ```

    See also [creating bundlers](#creating-a-bundler).

-   `options` _{Object}_ Configuration options, gets merged on top of `config.options`. Same properties exist as in `config.options`.

    -   `run` (`--run`) _{String|String[]}_ Pass a comma-separated list or an Array of bundle IDs to only run specified bundles. A falsy or non-String value will run all bundles.
    -   `watch` (`--watch`) _{Boolean|String|String[]}_ Set `true` to watch all bundles. Or pass a comma-separated String or Array of bundle IDs to watch specified bundles.
    -   `loglevel` (`--loglevel`) _{String}_ Determines how to log information. Can be 'trace', 'debug', 'info', 'warn', 'error', or 'silent'.
    -   `glob` (`--glob`) _{Object}_ Options passed directly to [globby](https://github.com/sindresorhus/globby), for use with `input` globs.
    -   `frontMatter` (`--front-matter`) _{Object}_ Options passed directly to [gray-matter](https://github.com/jonschlinkert/gray-matter).
    -   `chokidar` (`--chokidar`) _{Object}_ Options passed directly to [chokidar](https://github.com/paulmillr/chokidar).

-   `data` _{Object|Function}_ Local user data for use in [Bundlers](#the-bundler-object). This data gets merged on top of front matter for any given [File](#the-file-object).

## Creating a `bundler`

A `bundler` is a simple Node module that returns a Function. There is very little boilerplate and it is easy to create. For example:

```js
module.exports = (bundle, bundler) => bundle;
```

While the above example only returns the content and data exactly as it was found, it illustrates how little boilerplate is required and how easy it is to create a `bundler`.

Here is another example which appends a new line (`\n`) to the end of the content:

```js
const fs = require('fs');
module.exports = (bundle = {}, bundler = {}) => {
    bundle.output.forEach((file) => {
        file.content = file.content += '\n';
        return file.content;
    });
    // Don't forget to always return the bundle Object.
    return bundle;
};
```

You may also return a Promise, so long as it returns the `bundle` Object:

```js
const fs = require('fs');
module.exports = (bundle = {}, bundler = {}) => {
    // Return a promise...
    return new Promise((resolve) => {
        bundle.output.forEach((file) => {
            file.content = file.content += '\n';
            return file.content;
        });
        // ...which resolves the bundle Object.
        return resolve(bundle);
    });
};
```

### Guidelines for creating a bundler

1. A `bundler` must return a Function -- synchronous or asynchronous -- which returns the `bundle` Object. As illustrated above, the `bundle` Object, as well as the `bundler` Object, are passed to this Function. See [the `config` parameter](#the-config-parameter) for details about these Objects.

2. To access and modify content and data to be output, simply iterate through `bundle.output`, which contains [`file` Objects](#the-file-object) (**become familiar with the `file` Object**). For example:

    ```js
    module.exports = (bundle = {}, bundler = {}) => {
        bundle.output.forEach((file) => {
            // Modify files here.
        });
        return bundle;
    };
    ```

3. You typically shouldn't need to modify anything except the `file` Objects contained in `bundle.output`. Other properties are provided for convenience, but generally should be considered read-only.

### The `File` Object

The `output` property in the [result object](#bundles-result) contains an Array of `File` Objects, each of which contains both source and compiled content and data for a file to be output. Bundler authors should become extremely familiar with the `File` object.

Each file in `Bundles.result.output[n]` or `Bundles.result.outputMap[filepath]` has the following properties:

-   **`source`** _{Object}_ The source file is read in and this `source` Object created by [gray-matter](https://www.npmjs.com/package/gray-matter). **`source` properties should not be modified.** `source` contains the following properties (along with all other properties [returned by gray-matter](https://www.npmjs.com/package/gray-matter#returned-object)):
    -   **`path`** _{String}_ Source file path.
    -   **`content`** _{String}_ Source content (should not be modified).
    -   **`data`** _{String}_ Source front matter data (should not be modified).
-   **`content`** _{String|Buffer}_ Output content, intended to be modified by `bundler`s. Files that are not `utf8` encoded will be read as a [`Buffer`](https://nodejs.org/api/buffer.html).
-   **`data`** _{String}_ Output data, intended to be modified by `bundler`s. Bundles merges `config.data` and `bundle.data` on top of `file.data`, resulting in this custom data Object.
-   **`encoding`** _{String}_ Encoding of the file. Either `utf8` or `binary`.
-   **`isBuffer`** _{Boolean}_ Whether `file.content` is a [`Buffer`](https://nodejs.org/api/buffer.html). Will be true when the file `encoding` is `binary`.
