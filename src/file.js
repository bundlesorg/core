/*! file.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import globby from 'globby'
import path from 'path'
import fs from 'fs-extra'
import matter from 'gray-matter'
import merge from '@brikcss/merge'
import childProcess from 'child_process'
import { getEncoding } from 'istextorbinary'
import _ from './utilities'

// -------------------------------------------------------------------------------------------------
// File.
//

File.prototype.mergeData = function () {
  return merge([{},
    this.source.data,
    typeof this.bundle.data === 'function' ? this.bundle.data(this) : this.bundle.data || {}
  ], { arrayStrategy: 'overwrite' })
}

/**
 * File constructor.
 *
 * @param {String|Object} file  Path or object ({ path, content }) for eventual output files.
 * @param {Object} config  Bundle configuration.
 * @return {Object} File = {}
 */
function File (file = '', bundle = {}, input) {
  const options = bundle.options || {}
  options.cwd = options.cwd || process.cwd()

  // Cache reference to the bundle.
  this.bundle = bundle

  // Read file with gray-matter and set source props.
  const fileIsObject = _.isObject(file)
  let filepath = fileIsObject ? file.path : file
  filepath = path.isAbsolute(filepath) ? filepath : path.join(options.cwd, filepath)
  const content = fileIsObject ? file.content : fs.readFileSync(filepath)
  const encoding = getEncoding(content)

  // Create file.source, patterned after gray-matter's return object
  // (https://github.com/jonschlinkert/gray-matter#returned-object).
  this.source = {}
  if (encoding === 'utf8') {
    this.source = fileIsObject
      ? matter(file.content, options.frontMatter)
      : matter.read(filepath, options)
  } else {
    this.source = {
      content,
      data: {}
    }
  }
  this.source.input = input || file
  this.source.path = path.normalize(fileIsObject ? file.path : file)
  this.source.cwd = options.cwd

  // Front matter may cause a `\n` character at the beginning of source.content. Remove it in
  // file.content.
  if (this.source.data && this.source.content.indexOf('\n') === 0) this.source.content = this.source.content.slice(1)

  // Set file props, merge local/global data.
  this.content = this.source.content
  this.encoding = encoding
  this.isBuffer = Buffer.isBuffer(this.content)
  this.data = this.mergeData()
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Create one or many files from an input String or Object.
 *
 * @param  {String|Object} input  String or Object. Can be a file/dir path, git repo, or Object.
 * @param  {Object} bundle  Bundle configuration.
 * @return {Array}  Array of File Objects.
 */
function _createFiles (input = '', bundle = {}) {
  let filepaths
  // Ensure input is a String or Object with path and content props.
  const isObject = _.isObject(input)
  if ((typeof input !== 'string' && !isObject) || (isObject && (!input.path || !input.content))) {
    return [{
      source: {
        input
      }
    }]
  }
  // If input is an Object, we already have the content.
  if (isObject) return [new File(input, bundle)]
  // If input is a git repo, clone it and use local repo as input.
  if (_isGitRepo(input)) filepaths = _resolveGitRepo(input)
  // Resolve input paths with globby.
  filepaths = globby.sync(filepaths || input, bundle.options && bundle.options.glob ? bundle.options.glob : {})
  // Create and return Array of Files.
  return filepaths.map(filepath => new File(filepath, bundle, input))
}

/**
 * Check if String is a git repo.
 *
 * @param  {String}  input Input String.
 * @return {Boolean}  True if string matches syntax of a git repo.
 */
function _isGitRepo (input = '') {
  if (typeof input !== 'string') return false
  return input.indexOf('http://') === 0 ||
    input.indexOf('https://') === 0 ||
    input.indexOf('gh:') === 0 ||
    input.indexOf('git@') === 0
}

/**
 * Resolve git repo: clone to .repos/<id>/<name>, then update input to use local repo source.
 *
 * @param  {String} input   Input / source path.
 * @return {String}         The local path of the cloned repo.
 */
function _resolveGitRepo (input = '') {
  const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  // Use https for http URLs.
  // if (input.indexOf('http://') === 0) input = 'https://' + input.slice(7)
  // Convert github shorthand to proper URL syntax.
  if (input.indexOf('gh:') === 0) {
    input = input.slice(3).split('@')
    if (input.length === 1) input = `https://github.com/${input[0]}`
    else if (input.length === 2) input = `https://${input[0]}@github.com/${input[1]}`
    else if (input.length > 2) {
      const len = input[0].length
      input = `https://${input[0]}@github.com/${input.join('@').slice(len)}`
    }
  }
  // Add github token if it's github.
  if (GH_TOKEN && (input.indexOf('http://github.com') === 0 || input.indexOf('https://github.com'))) {
    input = `https://${GH_TOKEN + '@'}${input.replace('http://', '').replace('https://', '')}`
  }

  // Cache local path as: .repos/<user-id>/<repo-name>
  let localPath = path.parse(input)
  localPath.dir = localPath.dir.split(localPath.dir.includes('/') ? '/' : ':')
  localPath.dir = path.join('.repos', localPath.dir[localPath.dir.length - 1]).replace('git@', '')
  localPath = path.format(localPath).replace('.git', '')

  // Clone repo.
  const exec = childProcess.execSync
  fs.removeSync(localPath)
  fs.ensureDirSync(path.dirname(localPath))
  exec(`git clone ${input} ${localPath}`)

  // Return the local path.
  return localPath
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

File.create = _createFiles

export default File
