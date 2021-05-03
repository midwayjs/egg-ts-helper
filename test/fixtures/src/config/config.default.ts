import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { join } from 'path';

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1602058815455_4967';

  // add your config here
  config.middleware = ['reportMiddleware'];

  config.midwayFeature = {
    replaceEggLogger: true,
  };

  config.grpc = {
    services: [
      {
        url: 'localhost:6565',
        protoPath: join(__dirname, '../../proto/helloworld.proto'),
        package: 'helloworld',
      },
    ],
  };

  config.a = a => {
    console.log('a');
  };

  return config;
};
