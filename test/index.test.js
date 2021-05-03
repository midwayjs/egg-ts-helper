const { join } = require('path');
const fs = require('fs-extra');

describe('test/index.test.js', () => {

  it('test generate typings', () => {
    process.chdir(join(__dirname, 'fixtures'));
    require(join(__dirname, '../index'));
    // extend
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/application.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/context.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/helper.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/request.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/request.unittest.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/response.d.ts'))).toBeTruthy();

    // app
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/index.d.ts'))).toBeTruthy();
    //config
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/config/index.d.ts'))).toBeTruthy();
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/config/plugin.d.ts'))).toBeTruthy();
  });
});