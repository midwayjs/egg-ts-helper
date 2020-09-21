#! /usr/bin/env node
"use strict";
// const { hook } = require('module-hook');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const config_1 = require("egg-ts-helper/dist/config");
const cacheEggInfo = {};
const { parseJson } = require('egg-ts-helper/dist/utils');

require('egg-ts-helper/dist/utils').getEggInfo = function getEggInfo(cwd, option = {}) {
  cacheEggInfo[cwd] = cacheEggInfo[cwd] || {};
  const cmd = `node ${path.resolve(__dirname, './eggInfo')}`;
  const opt = {
    cwd,
    env: Object.assign(Object.assign(Object.assign({}, process.env), { TS_NODE_TYPE_CHECK: 'false', TS_NODE_TRANSPILE_ONLY: 'true', TS_NODE_FILES: 'false', EGG_TYPESCRIPT: 'true', CACHE_REQUIRE_PATHS_FILE: path.resolve(config_1.tmpDir, './requirePaths.json') }), option.env),
  };
  const end = json => {
    caches.eggInfo = json;
    caches.cacheTime = Date.now();
    if (option.callback) {
      return option.callback(json);
    }
    else {
      return json;
    }
  };
  // check cache
  const caches = cacheEggInfo[cwd];
  if (caches.cacheTime && (Date.now() - caches.cacheTime) < 1000) {
    return end(caches.eggInfo);
  }
  else if (caches.runningPromise) {
    return caches.runningPromise;
  }
  if (option.async) {
    // cache promise
    caches.runningPromise = new Promise((resolve, reject) => {
      child_process_1.exec(cmd, opt, err => {
        caches.runningPromise = null;
        if (err)
          reject(err);
        resolve(end(parseJson(fs.readFileSync(config_1.eggInfoPath, 'utf-8'))));
      });
    });
    return caches.runningPromise;
  }
  else {
    try {
      child_process.execSync(cmd, opt);
      return end(parseJson(fs.readFileSync(config_1.eggInfoPath, 'utf-8')));
    }
    catch (e) {
      console.error(e);
      return end({});
    }
  }
}

require('egg-ts-helper/dist/bin');
const indexPath = path.join(process.cwd(), 'typings/app/index.d.ts');
let data = fs.readFileSync(indexPath, 'utf-8');
data = data.replace("export * from 'egg';", 'import \'@midwayjs/web\';\nexport * from \'egg\';');
fs.writeFileSync(indexPath, data);
