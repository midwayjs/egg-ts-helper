const { join } = require('path');
const fs = require('fs-extra');

describe('test/index.test.js', () => {

  it('test generate typings', async () => {
    process.chdir(join(__dirname, 'fixtures'));
    require(join(__dirname, '../index'));
    // extend
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/application.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/context.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/helper.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/request.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/request.unittest.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/extend/response.d.ts')));

    // app
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/app/index.d.ts')));
    //config
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/config/index.d.ts')));
    expect(fs.existsSync(join(__dirname, 'fixtures/typings/config/plugin.d.ts')));
    await fs.removeSync(join(__dirname, 'fixtures/typings'));
  });
});