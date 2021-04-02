// 项目里肯定有 ts-node
require('ts-node/register');

const path = require('path');
const fs = require('fs-extra');
const extend = require('extend2');

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

// console.log(frameworkList)
// console.log(pluginList)

fs.ensureFileSync(path.join(process.cwd(), 'typings/app/index.d.ts'));
fs.ensureFileSync(path.join(process.cwd(), 'typings/config/index.d.ts'));
fs.ensureFileSync(path.join(process.cwd(), 'typings/config/plugin.d.ts'));

let app_idx_tpl = [
  '// This file is created by egg-ts-helper',
  '// Do not modify this file!!!!!!!!!',
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
  '// This file is created by egg-ts-helper',
  '// Do not modify this file!!!!!!!!!',
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
  return `    ${key}?: EggPluginItem;`;
}));
config_idx_tpl.push(`  }`);
config_idx_tpl.push(`}`);
fs.writeFileSync(path.join(process.cwd(), 'typings/config/index.d.ts'), config_idx_tpl.join('\r\n'));
// 重复
fs.writeFileSync(path.join(process.cwd(), 'typings/config/plugin.d.ts'), config_idx_tpl.join('\r\n'));
