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

Install globally (_recommended_):

```sh
npm install @bundles/core -g
```

or locally:

```sh
npm install @bundles/core -D
```

## Usage

**Node:**

```js
const bundle = require('@bundles/core');
bundle(config, options);
```

**CLI:**

```sh
bundle <path/to/config/file> [options]
```

_NOTE: Bundles is designed to be run with a config file. However, as documented below, the CLI executable supports passing certain `config.options` properties as flags at CLI runtime. All runtime `options` are merged down to `config.options`._

### The `config` Object

Bundles' API is designed to be minimal and easy to use, while reasonably flexible. It is intended that most configuration can and should come from bundlers. The `config` Object consists of the following properties:

-   **`bundles`** (_required_) _{Object[]}_ An Array of `bundle` Objects. Each `bundle` Object tells Bundles 1) what to compile, and 2) how to compile it. The `bundle` Object contains the following properties:

    -   **`id`** _{String}_ The bundle ID, used only for logging purposes. If not provided, Bundles will use its index position in `config.bundles`.
    -   **`input`** _{Array|String|Object}_ Source input. This can be 1) source file paths or globs (most common), 2) source content, or 3) paths to cloneable git repos. The way you configure `input` determines how Bundles handles source input, specifically:
        -   `String`: Bundles treats each input String as a source file path or glob, unless it starts with `http://` or `https://`, or uses the shorthand GitHub syntax: `gh:<github-id>/<repo>`. The latter cases are treated as a git repo, where Bundles clones it to `.repos` and uses it as the input source.
        -   `Object`: If `input` is an Object, Bundles treats the `content` property of the Object as source content, and the `path` property as the source path. This is useful to pass content directly to Bundles (i.e., from stdin, etc.). _NOTE: Even though Bundles doesn't access the source path in this case, the `path` is needed to understand where the file is intended to be output to._
        -   `Array`: Any item in an `input` Array can be an Object or String as documented above.
        -   `String` with `bundle.content`: This special use case exists as an alternative way to pass content directly to Bundles (i.e., from stdin, etc.). If `input` is a String AND `bundle.content` exists, Bundles uses `bundle.content` as the source content and `input` as the source path. _NOTE: Even though Bundles doesn't access the source path in this case, the `input` path is needed to understand where the file is intended to be output to._
    -   **`content`** _{String}_ **Only relevant if `input` is a String**, in which case `content` can be used to pass the source content. In this case `input` is used to determine the output path.
    -   **`data`** _{Object|Function}_ Local data. See [working with user data](#working-with-user-data).
    -   **`options`** _{Object}_ Configuration options, gets merged on top of `config.options`. Same properties exist as in `config.options`.
    -   **`bundlers`** _{String[]|Function[]|Object[]}_ A series of `bundler`s which tell Bundles how to compile the bundle. A `bundler` can be any of the following:

        -   `String`: A String will be "required" with node. For example, `'my-cool-bundler'` will require the `my-cool-bundler` NPM package, and `'./path/to/bundler'` will require the `bundler` local package.
        -   `Function`: A custom Function will be called when the bundler runs. For example: `(bundle = {}, bundler = {}) => { /* Do something cool. */ }`.
        -   `Object`: This is the most flexible way to configure a `bundler`, as it lets you pass settings offered by the bundler's author. For example: `{ run: (bundle, bundler) => { /* Do something cool. */ }, options: { /* Options provided by bundler author. */ }}`.

        _IMPORTANT: Bundler authors Other properties are typically available to allow users to configure each bundler. Make sure to read documentation for each bundler for how to configure them._

-   **`options`** _{Object}_ Global options.

    -   **`bundles` (`--bundles` or `-B`)** _{String|Array}_ Should be a comma-separated list or an Array of bundle IDs. This option tells Bundles which bundles to run. It allows you to only run a selected number of bundles rather than all that are configured.
    -   **`watch` (`--watch` or `-W`)** _{Boolean|String}_ Set `true` to watch all bundles. Pass a comma-separated String to only watch the bundle IDs listed.
    -   **`loglevel` (`--loglevel` or `-L`)** _{String}_ Determines how to log information. Can be 'trace', 'debug', 'info', 'warn', 'error', or 'silent'.
    -   **`glob` (`--glob` or `-G`)** _{Object}_ Options passed directly to [globby](https://github.com/sindresorhus/globby), for use with `input` globs.
    -   **`frontMatter` (`--front-matter` or `-M`)** _{Object}_ Options passed directly to [gray-matter](https://github.com/jonschlinkert/gray-matter).
    -   **`chokidar` (`--chokidar` or `-C`)** _{Object}_ Options passed directly to [chokidar](https://github.com/paulmillr/chokidar).

-   **`data`** _{Object|Function}_ Global data. See [working with user data](#working-with-user-data).

#### Working with User Data

Bundles integrates seamlessly with custom and dynamic user data. While Bundles core does nothing with user data, bundlers can use data to make Bundles more powerful and dynamic.

Data can be provided to Bundles any of the following ways:

-   front matter (`file.data`)
-   global data (`config.data`)
-   local data (`bundle.data`)

##### Data Merge Order / Priority

A deep merge is performed to merge data in the following order (lowest priority -> highest):

```js
merge({}, file.data, config.data, bundle.data);
```

##### Front Matter Data

Front matter can be provided in YAML, JSON, or JavaScript. See [gray-matter documentation](https://github.com/jonschlinkert/gray-matter) for details.

##### Global and Local Data

Local data (`bundle.data`) is merged on top of global data (`config.data`), and either one can be an `Object` or a `Function` that returns an Object:

```js
config = {
    data: (file, bundle) => {
        // Return data Object here.
    },
};
```

### The `result` Object

After compiling (i.e., after running all `bundler`s), Bundles returns a `result` Object which is a beefed up version of the original `config` Object. The `result` Object has the following useful properties:

-   **`success`** _{Boolean}_ Whether all bundles completed successfully.
-   **`bundles`** _{Object[]}_ Bundles that ran during the original compile. Each `bundle` Object has the following properties:
    -   **`success`** _{Boolean}_ Whether bundle compiled successfully.
    -   **`output`** _{Object[]}_ An Array of [`file` Objects](#the-file-object), each of which contain both source content and data, as well as content and data that Bundles will eventually output.
    -   **`_meta`** _{Object}_ Metadata used internal.
-   **`bundlesMap`** _{Object}_ Dictionary of bundles that ran, organized by bundle ID. Provided simply for an alternative way to look up bundle results.
-   **`options`** _{Object}_ Run time options, merged with configuration options.
-   **`watchers`** _{Object}_ A dictionary of watchers created by [chokidar](https://github.com/paulmillr/chokidar), organized by bundle ID.
-   **`_meta`** _{Object}_ Metadata used internally. May change at any time.

### The `file` Object

The `file` Object, or `result.bundles[n].output`, contains both source and compiled content and data for a single output (i.e., a file). Bundler authors must become extremely familiar the `output` property.

Each `output` Object contains the following properties:

-   **`source`** _{Object}_ The source file is read in and this `source` Object created by [gray-matter](https://www.npmjs.com/package/gray-matter). **`source` properties should not be modified.** `source` contains the following properties (along with all other properties [returned by gray-matter](https://www.npmjs.com/package/gray-matter#returned-object)):
    -   **`path`** _{String}_ Source file path.
    -   **`content`** _{String}_ Source content (should not be modified).
    -   **`data`** _{String}_ Source front matter data (should not be modified).
-   **`content`** _{String}_ Output content, intended to be modified by `bundler`s.
-   **`data`** _{String}_ Output data, intended to be modified by `bundler`s. See [working with user data](#working-with-user-data).

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

1. A `bundler` must return a Function -- synchronous or asynchronous -- which returns the `bundle` Object. As illustrated above, the `bundle` Object, as well as the `bundler` Object, are passed to this Function. See [the `config` Object](#the-config-object) for details about these Objects.

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
