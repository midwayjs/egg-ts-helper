import { App, Configuration } from '@midwayjs/decorator';
import { Application } from 'egg';
import { ILifeCycle } from '@midwayjs/core';
import * as test from 'midway-test-component';

@Configuration({
  imports: [require('@midwayjs/swagger'), test],
  conflictCheck: true,
})
export class AutoConfiguration implements ILifeCycle {
  @App()
  app: Application;

  async onReady() {}
}
