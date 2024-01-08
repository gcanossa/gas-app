import {
  GasClientApiHistoryChangeEventHandler,
  GasClientApiHistoryParams,
  GasClientApiLocation,
  GasClientApiRun,
  GasClientApiRunFailureFn,
  GasClientApiRunMethods,
  GasClientApiRunSuccessFn,
  GoogleClientApi,
} from "./types";

const history: {
  stack: GasClientApiHistoryParams[];
  changeHandler?: GasClientApiHistoryChangeEventHandler;
} = {
  stack: [],
  changeHandler: undefined,
};

function triggerHistoryChanged([
  state,
  params,
  hash,
]: GasClientApiHistoryParams) {
  history.changeHandler?.({
    state,
    location: {
      hash,
      parameter: Object.keys(params)
        .map((key) => ({
          [key]: Array.isArray(params[key])
            ? (params[key] as string[])[0]
            : (params[key] as string),
        }))
        .reduce((acc, p) => ({ ...acc, ...p }), {}),
      parameters: Object.keys(params)
        .map((key) => ({
          [key]: Array.isArray(params[key])
            ? (params[key] as string[])
            : [params[key] as string],
        }))
        .reduce((acc, p) => ({ ...acc, ...p }), {}),
    },
  });
}

export type GasClientApiRunMethodsMocks<T extends GasClientApiRunMethods> = {
  [P in keyof T]: (...p: Parameters<T[P]>) => Promise<any>;
};

export function initMocks<
  T extends GasClientApiRunMethods,
  C extends GasClientApiRunMethods = {}
>(
  mocks: GasClientApiRunMethodsMocks<T>,
  coreMocks?: GasClientApiRunMethodsMocks<C>
) {
  mocks = {
    ...mocks,
    ...{
      gas_core_invoke: (fnName: string, ...params: any[]) => {
        if (fnName in coreMocks! === false)
          throw new Error(`Unknown function ${fnName}`);

        return coreMocks![fnName].apply(null, params);
      },
    },
  };

  window.google = {
    script: {
      history: {
        push([state, params, hash]: GasClientApiHistoryParams): void {
          console.log(
            `google:script:history:push -> ${state}, ${params}, ${hash}`
          );
          history.stack.push([state, params, hash]);
          triggerHistoryChanged([state, params, hash]);
        },
        replace([state, params, hash]: GasClientApiHistoryParams): void {
          console.log(
            `google:script:history:replace -> ${state}, ${params}, ${hash}`
          );
          if (history.stack.length == 0)
            history.stack.push([state, params, hash]);
          else history.stack[history.stack.length - 1] = [state, params, hash];

          triggerHistoryChanged([state, params, hash]);
        },
        setChangeHandler(
          fn: GasClientApiHistoryChangeEventHandler | null
        ): void {
          console.log(`google:script:history:setChangeHandler`);
          history.changeHandler = fn?.bind(null) ?? null;
        },
      },
      url: {
        getLocation(fn: (e: GasClientApiLocation) => void): void {
          console.log(`google:script:url:getLocation`);

          fn({
            hash: window.location.hash,
            parameter: window.location.search.split("&").reduce((acc, kv) => {
              const [k, v] = kv.split("=");
              if (acc[k] === undefined) acc[k] = v;
              return acc;
            }, {}),
            parameters: window.location.search.split("&").reduce((acc, kv) => {
              const [k, v] = kv.split("=");
              if (acc[k] === undefined) acc[k] = [v];
              else acc[k].push(v);
              return acc;
            }, {}),
          });
        },
      },
      host: {
        get origin(): string {
          console.log(`google.script.host.origin`);
          return window.location.origin;
        },
        close(): void {
          console.log(`google.script.host.close`);
        },
        setHeight(value: number): void {
          console.log(`google.script.host.setHeight -> ${value}`);
        },
        setWidth(value: number): void {
          console.log(`google.script.host.setWidth -> ${value}`);
        },
        editor: {
          focus(): void {
            console.log(`google.script.host.editor.focus`);
          },
        },
      },
      get run() {
        let successFn: GasClientApiRunSuccessFn | null = null;
        let failureFn: GasClientApiRunFailureFn | null = null;
        let stateObj: object | null = null;
        const runner = {
          withFailureHandler(fn: GasClientApiRunFailureFn | null) {
            failureFn = fn?.bind(null);
            return runner;
          },
          withSuccessHandler(fn: GasClientApiRunSuccessFn | null) {
            successFn = fn?.bind(null);
            return runner;
          },
          withUserObject(userObject: object | null) {
            stateObj = userObject;
            return runner;
          },
          ...Object.keys(mocks).reduce(
            (acc, key) => ({
              ...acc,
              [key]: (...params: any[]) => {
                mocks[key].apply(null, params).then(
                  (r: any) => {
                    successFn?.(r, stateObj ?? undefined);
                  },
                  (e: Error) => {
                    failureFn?.(e, stateObj ?? undefined);
                  }
                );
              },
            }),
            {}
          ),
        } satisfies GasClientApiRun;

        return runner;
      },
    },
  } satisfies GoogleClientApi<T>;

  return window.google as GoogleClientApi<
    T & { gas_core_invoke: (name: string, ...params: any[]) => void }
  >;
}

export function delayedSuccess<T>(
  millis: number | [min: number, max: number],
  value?: T
): Promise<T | undefined> {
  return new Promise<T | undefined>((resolve) => {
    setTimeout(
      () => resolve(value),
      Array.isArray(millis)
        ? Math.random() * (millis[1] - millis[0]) + millis[0]
        : millis
    );
  });
}

export function delayedFailure(
  millis: number | [min: number, max: number],
  error: Error
): Promise<Error> {
  return new Promise<Error>((_, reject) => {
    setTimeout(
      () => reject(error),
      Array.isArray(millis)
        ? Math.random() * (millis[1] - millis[0]) + millis[0]
        : millis
    );
  });
}
