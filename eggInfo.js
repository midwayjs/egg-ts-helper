"use strict";
/**
 * Getting plugin info in child_process to prevent effecting egg application( splitting scopes ).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("cache-require-paths");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = require("egg-ts-helper/dist/config");
const utils = tslib_1.__importStar(require("egg-ts-helper/dist/utils"));
const cwd = process.cwd();
const eggInfo = {};
const startTime = Date.now();
const { dirname, join } = require('path');

if (utils.checkMaybeIsTsProj(cwd)) {
  // only require ts-node in ts project
  require('ts-node/register');
}

let isMidwayWeb = false;
try {
  require.resolve('@midwayjs/web');
  isMidwayWeb = true;
} catch (err) {}

const framework = isMidwayWeb ? '@midwayjs/web': ((utils.getPkgInfo(cwd).egg || {}).framework || 'egg');
const loader = getLoader(cwd, framework);
if (loader) {
  try {
    loader.loadPlugin();
  }
  catch (e) {
    // do nothing
  }
  // hack loadFile, ignore config file without customLoader for faster booting
  mockFn(loader, 'loadFile', filepath => {
    if (filepath && filepath.substring(filepath.lastIndexOf(path_1.default.sep) + 1).startsWith('config.')) {
      const fileContent = fs_1.default.readFileSync(filepath, 'utf-8');
      if (!fileContent.includes('customLoader'))
        return;
    }
    return true;
  });
  try {
    loader.loadConfig();
  }
  catch (e) {
    // do nothing
  }
  eggInfo.plugins = loader.allPlugins;
  eggInfo.config = loader.config;
  eggInfo.eggPaths = loader.eggPaths;
  eggInfo.timing = Date.now() - startTime;
}
utils.writeFileSync(config_1.eggInfoPath, JSON.stringify(eggInfo));
/* istanbul ignore next */
function noop() { }
function mockFn(obj, name, fn) {
  const oldFn = obj[name];
  obj[name] = (...args) => {
    const result = fn.apply(obj, args);
    if (result)
      return oldFn.apply(obj, args);
  };
}
function getLoader(baseDir, framework) {
  const dir = require.resolve(join(framework, 'package.json'));
  const frameworkPath = dirname(dir);
  const eggCore = findEggCore(baseDir, frameworkPath);
  /* istanbul ignore if */
  if (!eggCore)
    return;
  const EggLoader = eggCore.EggLoader;
  const egg = utils.requireFile(frameworkPath);
  /* istanbul ignore if */
  if (!egg || !EggLoader)
    return;
  process.env.EGG_SERVER_ENV = 'local';

  const CustomLoader = egg.createAppWorkerLoader(EggLoader);

  const app = Object.create(egg.Application.prototype);

  app.options = {
    typescript: true,
    isTsMode: true,
    baseDir
  }

  app.context = {};

  return new CustomLoader({
    baseDir: baseDir,
    logger: {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    },
    app,
  });
}
function findEggCore(baseDir, frameworkPath) {
  let eggCorePath = path_1.default.join(baseDir, 'node_modules/egg-core');
  if (!fs_1.default.existsSync(eggCorePath)) {
    eggCorePath = path_1.default.join(frameworkPath, 'node_modules/egg-core');
  }
  // try to load egg-core in cwd
  const eggCore = utils.requireFile(eggCorePath);
  if (!eggCore) {
    // try to resolve egg-core
    return utils.requireFile('egg-core');
  }
  return eggCore;
}
//# sourceMappingURL=eggInfo.js.map
