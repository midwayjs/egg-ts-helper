const { hook } = require('module-hook');
const path = require('path');

hook('egg-ts-helper', '1.x', (loadModule, replaceSource, version) => {
  replaceSource('dist/scripts/eggInfo.js', path.join(__dirname, 'eggInfo.js'));
});

module.exports = require('egg-ts-helper');
