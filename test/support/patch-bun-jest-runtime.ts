import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function patchFile(relativePath: string, patches: Array<[string, string]>) {
  const filePath = join(root, relativePath);
  let source = readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [before, after] of patches) {
    if (source.includes(after)) {
      continue;
    }

    if (!source.includes(before)) {
      throw new Error(`Unable to patch ${relativePath}: expected text missing`);
    }

    source = source.replace(before, after);
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, source);
  }
}

patchFile('node_modules/jest-runtime/build/index.js', [
  [
    `    for (const [key, value] of Object.entries(_module().default.Module)) {
      // @ts-expect-error: no index signature
      Module[key] = value;
    }`,
    `    for (const key of Object.keys(_module().default.Module)) {
      if (key === 'prototype') {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(_module().default.Module, key);
      if (!descriptor) {
        continue;
      }
      Object.defineProperty(Module, key, descriptor);
    }`,
  ],
]);

patchFile('node_modules/jest-circus/build/jestAdapterInit.js', [
  [
    `const {
  setTimeout,
  clearTimeout
} = globalThis;`,
    `const {
  setTimeout: timersSetTimeout,
  clearTimeout: timersClearTimeout
} = require('timers');
const setTimeout = globalThis.setTimeout ?? timersSetTimeout;
const clearTimeout = globalThis.clearTimeout ?? timersClearTimeout;`,
  ],
  [
    `    timeoutID.unref?.();
    clearTimeout(timeoutID);`,
    `    timeoutID?.unref?.();
    if (timeoutID !== undefined) {
      clearTimeout(timeoutID);
    }`,
  ],
]);

patchFile('node_modules/depd/index.js', [
  [
    `function callSiteLocation (callSite) {
  var file = callSite.getFileName() || '<anonymous>'
  var line = callSite.getLineNumber()
  var colm = callSite.getColumnNumber()

  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file
  }

  var site = [file, line, colm]

  site.callSite = callSite
  site.name = callSite.getFunctionName()

  return site
}`,
    `function callSiteLocation (callSite) {
  var file = typeof callSite.getFileName === 'function'
    ? callSite.getFileName() || '<anonymous>'
    : callSite.fileName || callSite.sourceURL || '<anonymous>'
  var line = typeof callSite.getLineNumber === 'function'
    ? callSite.getLineNumber()
    : callSite.lineNumber
  var colm = typeof callSite.getColumnNumber === 'function'
    ? callSite.getColumnNumber()
    : callSite.columnNumber

  if (typeof callSite.isEval === 'function' && callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file
  }

  var site = [file, line, colm]

  site.callSite = callSite
  site.name = typeof callSite.getFunctionName === 'function'
    ? callSite.getFunctionName()
    : callSite.name

  return site
}`,
  ],
]);
