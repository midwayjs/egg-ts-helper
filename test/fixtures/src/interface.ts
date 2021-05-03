/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number;
}

declare module 'egg' {
  interface Context {
    hello: string;
  }
}
