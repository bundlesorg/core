/* eslint-env jest */
import { differ } from '../src/utilities/differ'
import {
  matcherHint,
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  BOLD_WEIGHT
} from 'jest-matcher-utils'
import _ from '../src/utilities'
import Stringify from 'string.ify'
const stringify = Stringify.configure({
  rightAlignKeys: false,
  fancy: false,
  indent: '  ',
  pretty: true,
  maxLength: 20,
  maxDepth: 5,
  maxArrayLength: 60,
  maxObjectLength: 60,
  maxStringLength: 60
})
let diff = differ({ mode: 'expected' })

expect.extend({
  toMatchBundle (received, expected = {}, typesMap = {}) {
    // For props in expected that are supposed to be maps, convert arrays to maps.
    if (_.trueType(expected.output) === 'array') expected.output = outputToMap(expected.output)
    if (_.trueType(expected.changed) === 'array') expected.changed = outputToMap(expected.changed)
    if (_.trueType(expected.removed) === 'array') expected.removed = outputToMap(expected.removed)
    if (_.trueType(expected.input) === 'array') expected.input = inputToMap(expected.input, received.input)
    // Diff the received and expected.
    const diffs = diff(received, expected, {
      typesMap: Object.assign({
        id: 'string',
        valid: 'boolean',
        success: 'boolean,string',
        watching: 'boolean',
        watcher: 'null,object',
        input: 'map',
        output: 'map',
        changed: 'map',
        removed: 'map',
        sources: 'object',
        data: 'object',
        bundlers: 'array'
      }, typesMap)
    })
    // Check if any diffs were received and, if so, iterate through them to create a message.
    const pass = diffs.length === 0
    let message = matcherHint('toMatchBundle')
    if (!pass) message += formatDiffs(diffs, received.id || expected.id)
    return {
      pass: pass,
      message: () => message
    }
  },
  toMatchConfig (received, expected = {}) {
    // Create diffs.
    const diffs = diff(received, expected, {
      typesMap: {
        userConfig: 'object,string,array',
        success: 'boolean',
        watching: 'boolean',
        watchingData: 'boolean',
        watcher: 'object,null',
        configFile: 'string',
        dataFiles: 'array',
        bundles: 'array',
        options: 'object',
        data: 'object,function',
        on: 'object'
      }
    })
    // Check if any diffs were received and, if so, iterate through them to create a message.
    const pass = diffs.length === 0
    let message = matcherHint('toMatchConfig')
    if (!pass) message += formatDiffs(diffs)
    return {
      pass: pass,
      message: () => message
    }
  },
  toMatchFile (received, expected = {}, typesMap) {
    typesMap = typesMap === false ? false : Object.assign({
      source: {
        data: 'object',
        content: 'string',
        path: 'string',
        cwd: 'string'
      },
      content: 'string',
      data: 'object',
      encoding: 'string',
      isBuffer: 'boolean'
    }, typesMap)
    // Create diffs.
    const diffs = diff(received, expected, { typesMap })
    // Check if any diffs were received and, if so, iterate through them to create a message.
    const pass = diffs.length === 0
    let message = matcherHint('toMatchFile')
    if (!pass) message += formatDiffs(diffs)
    return {
      pass: pass,
      message: () => message
    }
  },
  toMatchBundler (received, expected = {}, typesMap = {}) {
    // Create diffs.
    const diffs = diff(received, expected, {
      typesMap: Object.assign({
        valid: 'boolean',
        run: 'function,string'
      }, typesMap)
    })
    // Check if any diffs were received and, if so, iterate through them to create a message.
    const pass = diffs.length === 0
    let message = matcherHint('toMatchBundler')
    if (!pass) message += formatDiffs(diffs)
    return {
      pass: pass,
      message: () => message
    }
  }
})

function inputToMap (input, received) {
  return new Map([input.reduce((map, source, i) => {
    const receivedInput = received.get(source)
    map.push([source, receivedInput || []])
    return map
  }, [])])
}

function outputToMap (output) {
  return new Map([output.reduce((map, file, i) => {
    map.push([file.source.path, file])
    return map
  }, [])])
}

function formatDiffs (diffs, id) {
  const introMap = {
    added: 'should exist but doesn\'t',
    removed: 'should not exist but does',
    changed: 'contains an unexpected value',
    type: 'contains an unexpected type'
  }
  let message = ['', '---------------- DIFFS -----------------']
  diffs = diffs.forEach((diff, i) => {
    message.push(`${BOLD_WEIGHT(i + 1 + ') ' + (id ? `[${id}] ` : '') + '`' + diff.path + '` ' + introMap[diff.type] + '.')}` + `\n- ${EXPECTED_COLOR(`Expected: ${diff.expected.type} ${stringify(diff.expected.value)}`)}\n- ${RECEIVED_COLOR(`Received: ${diff.received.type} ${stringify(diff.received.value)}`)}`)
  })
  message.push('----------------------------------------')
  return message.join('\n\n')
}
