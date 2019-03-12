---
metadata:
  reference: '<https://postcss.org>'
---

const env = process.env.NODE_ENV
const isProd = ['production', 'test'].includes(env)

module.exports.sets = {
  // Mixins: JS in CSS.
  mixins: {
    base: ['postcss-mixins'],
    utilities: ['postcss-generate-preset'],
    other: ['postcss-at-rules-variables', 'postcss-functions', 'postcss-map']
  },
  // Modular: Keep things modular.
  modular: {
    base: ['postcss-import', 'postcss-use', 'postcss-nested-ancestors', 'postcss-nested'],
    vars: ['postcss-custom-media', 'postcss-apply', 'postcss-custom-selectors'],
    extends: ['postcss-extend', 'postcss-reference', 'postcss-ref', 'postcss-property-lookup'],
    modules: ['postcss-scoped']
  },
  // Automate: Set and forget. Fallbacks, polyfills, and helpful automations.
  automate: {
    base: [
      'postcss-css-variables',
      'css-mqpacker',
      'postcss-pxtorem',
      'postcss-flexbugs-fixes'
    ],
    assets: ['postcss-assets', 'postcss-url', 'postcss-image-set-function'],
    fonts: ['postcss-font-magician', 'postcss-font-family-system-ui'],
    vars: ['postcss-extract-value'],
    colors: ['postcss-color-mod-function', 'postcss-color-functional-notation', 'colorguard'],
    rules: [
      'postcss-selector-not',
      'postcss-pseudo-class-any-link',
      'postcss-focus-within',
      'postcss-initial',
      'postcss-prefixer',
      'css-byebye'
    ]
  },
  // Optimize: Prepare for production.
  optimize: {
    base: ['postcss-sorting', 'autoprefixer', 'postcss-reporter'],
    production: ['css-byebye', 'postcss-hash', 'postcss-csso']
  }
}

// Export the plugins list, sorted.
const pluginsConfig = (module.exports.plugins = {
  // -----------------------------------------------------------
  // FIRST: These plugins are order dependent and must be first.
  //

  // https://github.com/postcss/postcss-import: IMPORTANT: Should be first. Import CSS files for
  // processing.
  'postcss-import': {
    // filter: (filepath) => {},
    // root: process.cwd(),
    path: ['node_modules']
    // plugins: [],
    // resolve: (id, baseDir, importOptions) => {},
    // load: (filename, importOptions) => {},
    // skipDuplicates: true,
    // addModulesDirectories: []
  },

  // https://github.com/postcss/postcss-use: IMPORTANT: Placed first to process file-specific
  // plugins before continuing. Use PostCSS plugins inline.
  'postcss-use': {
    modules: [/^postcss/]
    // options: {
    //  'postcss-plugin-name': {}
    // }
  },

  // https://github.com/postcss/postcss-mixins: IMPORTANT: Must be before postcss-nested and
  // postcss-simple-vars. Create custom CSS or JS mixins.
  'postcss-mixins': {
    // mixins: {},
    mixinsFiles: ['src/mixins/*.js', 'node_modules/@brikcss/*/src/mixins/*.js']
    // mixinsDir: './src/mixins',
  },

  // https://github.com/toomuchdesign/postcss-nested-ancestors: Supports referencing
  // parent/ancestor selectors in nested CSS.
  'postcss-nested-ancestors': {
    placeholder: '^&',
    levelSymbol: '^',
    parentSymbol: '&',
    replaceDeclarations: false
  },

  // https://github.com/postcss/postcss-nested: Support nesting of selectors.
  'postcss-nested': { bubble: [], preserveEmpty: false },

  // ------------------------------------------------------------
  // These plugins are not known to depend on any specific order.
  //

  // https://github.com/GitScrum/postcss-at-rules-variables: Add support for @for, @each, and @if statements.
  'postcss-at-rules-variables': {
    atRules: ['for', 'if', 'else', 'each', 'mixin', 'custom-media'],
    variables: {}
  },

  // https://github.com/andyjansson/postcss-functions: Use JS functions in CSS properties.
  'postcss-functions': {
    functions: {},
    glob: [] // Loads files as functions based on one or more glob patterns. Function name corresponds with file name.
  },

  // https://github.com/pascalduez/postcss-map: Use JS/YML configuration objects in CSS.
  'postcss-map': {
    basePath: process.cwd(),
    maps: [],
    defaultMap: 'config'
  },

  // https://github.com/MadLittleMods/postcss-css-variables: IMPORTANT: Must come after postcss-nested. Polyfills css variables/properties.
  'postcss-css-variables': {
    preserve: true,
    variables: {},
    preserveInjectedVariables: true
  },

  // https://github.com/postcss/postcss-custom-selectors: Support variables for custom selectors.
  'postcss-custom-selectors': {
    lineBreak: true,
    extensions: {},
    transformMatches: false
  },

  // https://github.com/postcss/postcss-custom-media: Custom media queries.
  'postcss-custom-media': {
    extensions: {
      '--phone': '(min-width: 600px)',
      '--tablet': '(min-width: 900px)',
      '--desktop': '(min-width: 1200px)',
      '--wide': '(min-width: 1440px)'
    },
    preserve: true,
    appendExtensions: false
  },

  // https://github.com/pascalduez/postcss-apply: Supports custom property sets.
  'postcss-apply': {},

  // https://github.com/travco/postcss-extend: Supports @extend and %placeholder rules.
  'postcss-extend': {},

  // https://github.com/dehuszar/postcss-reference: Reference outside selectors, allowing you to
  // extend selectors from other files.
  'postcss-reference': {},

  // https://github.com/morishitter/postcss-ref: Reference properties from another rule.
  'postcss-ref': {},

  // https://github.com/simonsmith/postcss-property-lookup: Adds support for referencing property
  // values without a variable.
  'postcss-property-lookup': {},

  // https://github.com/borodean/postcss-assets: Manage assets.
  'postcss-assets': {
    basePath: 'src/',
    baseUrl: '/',
    cachebuster: true,
    cache: true,
    loadPaths: [],
    relative: true
  },

  // https://github.com/alex499/postcss-image-set: Fallback for image set.
  'postcss-image-set-function': {},

  // https://github.com/postcss/postcss-url: Rebase, inline, or copy assets. Works with postcss-assets.
  'postcss-url': {},

  // https://github.com/jonathantneal/postcss-font-magician: Auto generate @font-face rules.
  'postcss-font-magician': {
    //  variants: {}, // Download specific variants.
    //  hosted: [], // Directory(ies) of self-hosted fonts.
    //  aliases: {}, // Aliases for given fonts.
    //  formats: 'local woff2 woff eot',
    //  foundries: 'custom hosted bootstrap google',
    //  custom: {}, // Custom settings.
  },

  // https://github.com/JLHwung/postcss-font-family-system-ui: Transforms font-family: system-ui;
  // to the appropriate font list.
  'postcss-font-family-system-ui': {},

  // https://github.com/lutien/postcss-extract-value: Automatically extract values from specified
  // properties and put them into variables.
  'postcss-extract-value': {
    filterByProps: [], // CSS properties to extract values for.
    onlyColor: false,
    scope: ':root', // Selector which will contain variables.
    variableSyntax: '', // Uses var() syntax by default.
    templateVariableName: '[selectorName]__[propertyName]' // Template for naming variables.
  },

  // https://github.com/hail2u/node-css-mqpacker: Packs multiple media queries into one.
  'css-mqpacker': {},

  // https://github.com/jonathantneal/postcss-color-mod-function: Support CSS4 color-mod() function.
  'postcss-color-mod-function': {},

  // https://github.com/jonathantneal/postcss-color-functional-notation: Use CSS4 space/slash
  // notation in color functions.
  'postcss-color-functional-notation': {},

  // https://github.com/SlexAxton/css-colorguard: Combines colors within a specificed threshold to
  // reduce number of color values.
  colorguard: {
    // ignore: [],
    // threshold: 3,
    // whitelist: [[]]
  },

  // https://github.com/postcss/postcss-selector-not: Transforms CSS4 :not() to CSS3 :not().
  // Allows you to have multiple selectors in :not().
  'postcss-selector-not': {},

  // https://github.com/jonathantneal/postcss-pseudo-class-any-link: Adds :any-link pseudo class,
  // a shortcut for :link, :visited.
  'postcss-pseudo-class-any-link': { preserve: true },

  // https://github.com/jonathantneal/postcss-focus-within: Supports :focus-within pseudo selector.
  'postcss-focus-within': {},

  // https://github.com/maximkoretskiy/postcss-initial: Adds support for \`initial\` and \`all:
  // initial\` keyword in property values.
  'postcss-initial': {
    reset: 'all', // Subset of rules which should be reset with \`all\` property to reduce code weight.
    replace: false
  },

  // https://github.com/cuth/postcss-pxtorem: Convert pixel values to rems.
  'postcss-pxtorem': {
    rootValue: 8,
    unitPrecision: 5,
    propList: ['*'],
    selectorBlackList: [':root', 'html', 'body'],
    replace: true,
    mediaQuery: false,
    minPixelValue: 0
  },

  // https://github.com/marceloucker/postcss-prefixer: Adds specified prefix to all classes and
  // ids.
  'postcss-prefixer': {
    // prefix: '',
    // ignore: []
  },

  // https://github.com/simonsmith/postcss-generate-preset: Quickly generate utility classes.
  'postcss-generate-preset': { useImportant: false, zeroValue: '0' },

  // https://github.com/luisrudge/postcss-flexbugs-fixes: Auto fixes for flexbox.
  'postcss-flexbugs-fixes': {},

  // https://github.com/hudochenkov/postcss-sorting: Keeps rules and at-rules content in a sorted
  // order.
  'postcss-sorting': {
    order: [
      'custom-properties',
      'dollar-variables',
      'at-variables'
      // 'declarations',
      // 'rules',
      // 'at-rules'
    ], // Specify order of content in declaration blocks.
    'properties-order': [
      {
        emptyLineBefore: false,
        properties: [
          'display',
          'align-items',
          'align-content',
          'justify-content',
          'flex-direction',
          'flex-order',
          'flex-pack',
          'flex-align',
          'float',
          'clear',
          'clip',
          'zoom',
          'visibility',
          'overflow',
          'overflow-x',
          'overflow-y'
        ]
      },
      {
        emptyLineBefore: true,
        properties: ['position', 'top', 'right', 'bottom', 'left', 'z-index']
      },
      {
        emptyLineBefore: true,
        properties: [
          'box-sizing',
          'width',
          'min-width',
          'max-width',
          'height',
          'min-height',
          'max-height',
          'margin',
          'margin-top',
          'margin-right',
          'margin-bottom',
          'margin-left',
          'padding',
          'padding-top',
          'padding-right',
          'padding-bottom',
          'padding-left'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'outline',
          'outline-width',
          'outline-style',
          'outline-color',
          'outline-offset',
          'box-shadow',
          'border',
          'border-top',
          'border-right',
          'border-bottom',
          'border-left',
          'border-width',
          'border-top-width',
          'border-right-width',
          'border-bottom-width',
          'border-left-width',
          'border-style',
          'border-top-style',
          'border-right-style',
          'border-bottom-style',
          'border-left-style',
          'border-color',
          'border-top-color',
          'border-right-color',
          'border-bottom-color',
          'border-left-color',
          'border-radius',
          'border-top-left-radius',
          'border-top-right-radius',
          'border-bottom-right-radius',
          'border-bottom-left-radius',
          'border-image',
          'border-image-source',
          'border-image-slice',
          'border-image-width',
          'border-image-outset',
          'border-image-repeat'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'background',
          'background-color',
          'background-image',
          'background-repeat',
          'background-attachment',
          'background-position',
          'background-position-x',
          'background-position-y',
          'background-clip',
          'background-origin',
          'background-size',
          'box-decoration-break',
          'opacity',
          'filter',
          'interpolation-mode'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'font',
          'font-family',
          'font-size',
          'font-weight',
          'font-style',
          'font-variant',
          'font-size-adjust',
          'font-stretch',
          'font-effect',
          'font-emphasize',
          'font-emphasize-position',
          'font-emphasize-style',
          'font-smooth',
          'line-height',
          'letter-spacing',
          'word-spacing',
          'color'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'content',
          'quotes',
          'counter-reset',
          'counter-increment',
          'resize',
          'cursor',
          'user-select',
          'nav-index',
          'nav-up',
          'nav-right',
          'nav-down',
          'nav-left',
          'text-align',
          'text-align-last',
          'vertical-align',
          'white-space',
          'text-decoration',
          'text-emphasis',
          'text-emphasis-color',
          'text-emphasis-style',
          'text-emphasis-position',
          'text-indent',
          'text-justify',
          'text-shadow',
          'writing-mode',
          'text-outline',
          'text-transform',
          'text-wrap',
          'text-overflow',
          'text-overflow-ellipsis',
          'text-overflow-mode',
          'word-wrap',
          'word-break',
          'tab-size',
          'hyphens',
          'pointer-events'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'list-style',
          'list-style-position',
          'list-style-type',
          'list-style-image',
          'table-layout',
          'border-collapse',
          'border-spacing',
          'empty-cells',
          'caption-side'
        ]
      },
      {
        emptyLineBefore: true,
        properties: [
          'transition',
          'transition-delay',
          'transition-timing-function',
          'transition-duration',
          'transition-property',
          'transform',
          'transform-origin',
          'animation',
          'animation-name',
          'animation-duration',
          'animation-play-state',
          'animation-timing-function',
          'animation-delay',
          'animation-iteration-count',
          'animation-direction'
        ]
      }
    ],
    // 'properties-order': 'alphabetical',
    'unspecified-properties-position': 'bottomAlphabetical', // Specify position for properties not specified in `properties-order` config (if you provided an Array of properties).
    'throw-validate-errors': false
  },

  // https://github.com/AoDev/css-byebye: Remove selectors you don't need.
  'css-byebye': {
    rulesToRemove: [] // String or Regex expressions of selectors to exclude.
  },

  // https://github.com/postcss/autoprefixer: Auto generates vendor prefixed properties based on
  // browser support.
  autoprefixer: {},

  // https://github.com/lahmatiy/postcss-csso: Minify output css.
  'postcss-csso': {
    restructure: true,
    forceMediaMerge: false,
    comments: true, // 'exclamation' (true) | 'first-exclamation' | false
    usage: null,
    logger: null
  },

  // Postcss modules for selector scoping and importing into JS.
  'postcss-scoped': {
    filter: (filename) => filename.includes('header.module.css')
  },

  // https://github.com/dacodekid/postcss-hash: Replace output file names with hash algorithms for
  // cache busting.
  'postcss-hash': { algorithm: 'md5', trim: 10, manifest: './manifest.json' },

  // https://github.com/postcss/postcss-reporter: Log postcss output to console.
  'postcss-reporter': {
    clearReportedMessages: true,
    throwError: isProd,
    sortByPosition: true
  }
})

// Default export returns an Array of plugins (required), sorted in order based on pluginsConfig.
module.exports = (...plugins) => {
  // Sort plugins to order set in pluginsConfig.
  const sorted = Object.keys(pluginsConfig)
  plugins.sort((a, b) => {
    const indexA = sorted.indexOf(a)
    const indexB = sorted.indexOf(b)
    // If an item is not a string, is equal to another, or doesn't exist in the config, leave it
    // where it is.
    if (typeof a !== 'string' || typeof b !== 'string' || indexA === -1 || indexB === -1) {
      return 0
    }
    return indexA - indexB
  })
  // Require each plugin.
  return plugins.map((plugin) => {
    if (typeof plugin === 'string') {
      return require(plugin)(pluginsConfig[plugin])
    }
    return plugin
  })
}
