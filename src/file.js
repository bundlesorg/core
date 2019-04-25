/*! file.js | @author brikcss <https://github.com/brikcss> | @reference https://github.com/brikcss/bundles-core */

// -------------------------------------------------------------------------------------------------
// Imports and setup.
//

import globby from 'globby'
import path from 'path'
import fs from 'fs-extra'
import matter from 'gray-matter'
import childProcess from 'child_process'
import { getEncoding } from 'istextorbinary'
import _ from './utilities'

// -------------------------------------------------------------------------------------------------
// File constructor.
//

/**
 * File constructor.
 * @param {String|Object} input   Path or content { path, content } for eventual output files.
 * @param {Object} options
 * @return {Object} File = {}
 */
function File (input = '', options = {}) {
  options.cwd = options.cwd || process.cwd()
  // Read file with gray-matter and set source props.
  const inputIsObject = _.isObject(input)
  const content = inputIsObject ? input.content : fs.readFileSync(path.join(options.cwd, input))
  const encoding = getEncoding(content)

  // Create file.source, patterned after gray-matter's return object
  // (https://github.com/jonschlinkert/gray-matter#returned-object).
  this.source = {}
  if (encoding === 'utf8') {
    this.source = inputIsObject
      ? matter(input.content, options)
      : matter.read(path.join(options.cwd, input), options)
  } else {
    this.source = {
      content,
      data: {},
      orig: content
    }
  }
  this.source.path = path.normalize(inputIsObject ? input.path : input)
  this.source.cwd = options.cwd

  // Front matter may cause a `\n` character at the beginning of source.content. Remove it in
  // file.content.
  if (this.source.data && this.source.content.indexOf('\n') === 0) this.source.content = this.source.content.slice(1)

  // Set file props, merge local/global data.
  this.content = this.source.content
  this.encoding = encoding
  this.isBuffer = Buffer.isBuffer(this.content)
  this.data = Object.assign({},
    this.source.data,
    typeof this.data === 'function' ? this.data(this) : this.data
  )
}

// -------------------------------------------------------------------------------------------------
// Helper functions.
//

/**
 * Set default global data.
 * @param {Object} data
 */
function setGlobals (data = {}) {
  const proto = File.prototype
  proto.data = data
  return proto
}

/**
 * Create one or many files from an input String or Object.
 * @param  {String|Object} input  String or Object. Can be a file/dir path, git repo, or Object.
 * @param  {Object} options  Options.
 * @return {Array}  Array of File Objects.
 */
function createFiles (input = '', options = {}) {
  const files = []
  // Ensure input is a String or Object with path and content props.
  const isObject = _.isObject(input)
  if ((typeof input !== 'string' && !isObject) || (isObject && (!input.path || !input.content))) return files

  // If input is an Object, we already have the content.
  if (isObject) return [new File(input, options)]

  // If input is a git repo, clone it and use local repo as input.
  if (isGitRepo(input)) input = resolveGitRepo(input)

  // Resolve input paths with globby.
  input = globby.sync(input, options.glob)

  // Create and return Array of Files.
  return input.map(filepath => new File(filepath, options))
}

/**
 * Check if String is a git repo.
 * @param  {String}  input Input String.
 * @return {Boolean}  True if string matches syntax of a git repo.
 */
function isGitRepo (input = '') {
  if (typeof input !== 'string') return false
  return input.indexOf('http://') === 0 ||
    input.indexOf('https://') === 0 ||
    input.indexOf('gh:') === 0 ||
    input.indexOf('git@') === 0
}

/**
 * Resolve git repo: clone to .repos/<id>/<name>, then update input to use local repo source.
 * @param  {String} input   Input / source path.
 * @param  {Object} options Configuration options.
 * @return {String}         The local path of the cloned repo.
 */
function resolveGitRepo (input = '', options = {}) {
  // Convert github shorthand to proper URL syntax.
  if (input.indexOf('gh:') === 0) {
    input = input.slice(3).split('@')
    if (input.length === 1) input = `https://github.com/${input[0]}.git`
    else if (input.length === 2) input = `https://${input[0]}@github.com/${input[1]}.git`
    else if (input.length > 2) {
      const len = input[0].length
      input = `https://${input[0]}@github.com/${input.join('@').slice(len)}.git`
    }
  }

  // Cache local path as: .repos/<user-id>/<repo-name>
  let localPath = path.parse(input)
  localPath = path.join('.repos', path.basename(localPath.dir).replace(':', '-').replace('git@', ''), localPath.name)

  // Clone repo.
  const exec = childProcess.execSync
  fs.ensureDirSync('.repos')
  fs.removeSync(localPath)
  exec(`git clone ${input} ${localPath}`)

  // Return the local path.
  return localPath
}

// -------------------------------------------------------------------------------------------------
// Exports.
//

File.create = createFiles
File.setGlobals = setGlobals

export default File
