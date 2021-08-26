// 项目里肯定有 ts-node
require('ts-node/register');

const path = require('path');
const fs = require('fs-extra');
const extend = require('extend2');

const WARN_MSG = [
  '// This file is created by egg-ts-helper',
  '// Do not modify this file!!!!!!!!!',
];

function safeRequire(p, enabledCache = true) {
  if (p.startsWith(`.${path.sep}`) || p.startsWith(`..${path.sep}`)) {
    p = resolve(dirname(module.parent.filename), p);
  }
  try {
    if (enabledCache) {
      return require(p);
    } else {
      const content = readFileSync(p, {
        encoding: 'utf-8',
      });
      return JSON.parse(content);
    }
  } catch (err) {
    return undefined;
  }
};

function safeResolve(module) {
  try {
    const modulePath = require.resolve(module);
    let dir = path.dirname(modulePath);
    if (fs.existsSync(path.join(dir, 'config'))) {
      return dir;
    }
    if (/dist$/.test(dir)) {
      dir = path.dirname(dir);
      if (fs.existsSync(path.join(dir, 'config'))) {
        return dir;
      }
    }
  } catch (err) {}
}

/**
 * 思路很简单，只支持 egg，midway，以及最多一层的依赖，写死白名单即可。
 */
const frameworkSet = new Set();
frameworkSet.add('egg');
frameworkSet.add('@midwayjs/web');
frameworkSet.add('@ali/egg');
frameworkSet.add('@ali/midway');

const pkg = safeRequire(path.join(process.cwd(), 'package.json'));
if (pkg['egg'] && pkg['egg']['framework']) {
  frameworkSet.add(pkg['egg']['framework']);
}

const frameworkList = [];
const pluginList = {};

for (const framework of Array.from(frameworkSet))  {
  const baseDir = safeResolve(framework);
  if (baseDir) {
    // find framework
    frameworkList.push(framework);
    // find plugin
    if (fs.existsSync(path.join(baseDir, 'config/plugin.js'))) {
      const plugins = require(path.join(baseDir, 'config/plugin.js'));
      for (const key in plugins) {
        if (typeof plugins[key] !== 'object') {
          plugins[key] =  {
            enable: true,
          }
        }
      }
      extend(true, pluginList, plugins);
    }
  }
}

// find app plugin
let appPlugin = safeRequire(path.join(process.cwd(), 'src/config/plugin'));
if (appPlugin) {
  if (appPlugin.default) {
    appPlugin = appPlugin.default;
  }
  for (const key in appPlugin) {
    if (typeof appPlugin[key] !== 'object') {
      appPlugin[key] =  {
        enable: true,
      }
    }
  }
  extend(true, pluginList, appPlugin);
}

// console.log(frameworkList)
// console.log(pluginList)

fs.ensureFileSync(path.join(process.cwd(), 'typings/app/index.d.ts'));
fs.ensureFileSync(path.join(process.cwd(), 'typings/config/index.d.ts'));
fs.ensureFileSync(path.join(process.cwd(), 'typings/config/plugin.d.ts'));

let app_idx_tpl = [
  ...WARN_MSG,
];
// import 'egg';
// import '@midwayjs/web';
// export * from 'egg';
// export as namespace Egg;
app_idx_tpl = app_idx_tpl.concat(frameworkList.map(framework => {
  return `import '${framework}';`;
}));
app_idx_tpl.push(`export * from 'egg';`);
app_idx_tpl.push(`export as namespace Egg;`);
fs.writeFileSync(path.join(process.cwd(), 'typings/app/index.d.ts'), app_idx_tpl.join('\r\n'));

// import '@midwayjs/web';
// import 'egg';
// import 'egg-onerror';
// import 'egg-session';
// import { EggPluginItem } from 'egg';
// declare module 'egg' {
//   interface EggPlugin {
//     onerror?: EggPluginItem;
//     session?: EggPluginItem;
//   }
// }
let config_idx_tpl = [
  ...WARN_MSG,
];
// 框架部分
config_idx_tpl = config_idx_tpl.concat(frameworkList.map(framework => {
  return `import '${framework}';`;
}));
// 插件包部分
config_idx_tpl = config_idx_tpl.concat(Object.values(pluginList).map(item => {
  return `import '${item.package}';`;
}));
config_idx_tpl.push(`import { EggPluginItem } from 'egg';`);
config_idx_tpl.push(`declare module 'egg' {`);
config_idx_tpl.push(`  interface EggPlugin {`);
// 插件key部分
config_idx_tpl = config_idx_tpl.concat(Object.keys(pluginList).map(key => {
  return `    '${key}'?: EggPluginItem;`;
}));
config_idx_tpl.push(`  }`);
config_idx_tpl.push(`}`);
fs.writeFileSync(path.join(process.cwd(), 'typings/config/index.d.ts'), config_idx_tpl.join('\r\n'));
// 重复
fs.writeFileSync(path.join(process.cwd(), 'typings/config/plugin.d.ts'), config_idx_tpl.join('\r\n'));

// 支持 extend 扩展
const extendRoot = path.join(process.cwd(), 'src/app/extend');
if (fs.existsSync(extendRoot)) {
  fs.ensureDirSync(path.join(process.cwd(), `typings/app/extend/`));
  const extendMap = {
    Helper: 'IHelper',
    Request: 'Request',
    Response: 'Response',
    Application: 'Application',
    Context: 'Context',
  }
  const dirs = fs.readdirSync(extendRoot);
  for (const file of dirs) {
    if (/^(application|context|helper|request|response)/.test(file)) {
      const splits = file.split('.');
      const filename = splits[0];
      const filenameCamelCase = filename.charAt(0).toUpperCase() + filename.slice(1);
      let env = '';
      let envCamelCase = '';
      if(splits.length === 3) {
        // *.{env}.ts
        env = splits[1];
        envCamelCase = env.charAt(0).toUpperCase() + env.slice(1);
      }
      const extend_tpl = [
        ...WARN_MSG,
        `import 'egg';`,
        `import Extend${envCamelCase}${filenameCamelCase} from '../../../src/app/extend/${file.replace('.ts', '')}';`,
        `type Extend${envCamelCase}${filenameCamelCase}Type = typeof Extend${envCamelCase}${filenameCamelCase};`,
        `declare module 'egg' {`,
        `  interface ${extendMap[filenameCamelCase]} extends Extend${envCamelCase}${filenameCamelCase}Type { }`,
        `}`,
      ];
      fs.writeFileSync(path.join(process.cwd(), `typings/app/extend/${file.replace('.ts', '')}.d.ts`), extend_tpl.join('\r\n'));
    }
  }
}
