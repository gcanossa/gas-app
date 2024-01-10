import { GasServerApiRunMethods, GoogleClientApi } from "./types";

export type GasClientBridge<T extends GasServerApiRunMethods> = {
  [P in keyof T]: (
    ...params: Parameters<T[P]>
  ) => Promise<[Awaited<ReturnType<T[P]>>, void]>;
} & {
  [P in keyof T & string as `ctx_${P}`]: <C>(
    ctx: C,
    ...params: Parameters<T[P]>
  ) => Promise<[Awaited<ReturnType<T[P]>>, C]>;
};

export function createBridge<
  T extends GasServerApiRunMethods
>(): GasClientBridge<T> {
  const hdl = window.google as GoogleClientApi<T>;

  return new Proxy(hdl.script.run, {
    get(target, propName, receiver) {
      const propString = String(propName);
      const isPropWithCtx = /^ctx_/.test(propString);
      const prop = propString.replace(/^ctx_/, "");
      if (prop in target === false)
        throw new Error(`Unknown Google App Script remote function '${prop}'`);

      return (...params: any[]) => {
        return new Promise((resolve, reject) => {
          let prep = target
            .withFailureHandler((error, ctx) => reject([error, ctx]))
            .withSuccessHandler((result, ctx) => resolve([result, ctx]));
          if (isPropWithCtx && params[0] !== null && params[0] !== undefined) {
            prep.withUserObject(params[0])[prop].apply(null, params.slice(1));
          } else {
            prep[prop].apply(null, params);
          }
        });
      };
    },
  });
}

export function createGasAppBridge<T extends GasServerApiRunMethods>(
  invokeFunctionName: string
): GasClientBridge<T> {
  const hdl = window.google as GoogleClientApi<T>;

  return new Proxy(hdl.script.run, {
    get(target, propName, receiver) {
      const propString = String(propName);
      const isPropWithCtx = /^ctx_/.test(propString);
      const prop = propString.replace(/^ctx_/, "");

      return (...params: any[]) => {
        return new Promise((resolve, reject) => {
          let prep = target
            .withFailureHandler((error, ctx) => reject([error, ctx]))
            .withSuccessHandler((result, ctx) => resolve([result, ctx]));
          if (isPropWithCtx && params[0] !== null && params[0] !== undefined) {
            prep
              .withUserObject(params[0])
              [invokeFunctionName].apply(null, [prop, ...params.slice(1)]);
          } else {
            prep[invokeFunctionName].apply(null, [prop, ...params]);
          }
        });
      };
    },
  });
}
