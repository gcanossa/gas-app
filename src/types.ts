export type GasClientApiLocation = {
  hash: string | null;
  parameter: { [key: string]: string };
  parameters: { [key: string]: string[] };
};

export type GasClientApiHistoryChangeEvent = {
  state: object | null;
  location: GasClientApiLocation;
};

export type GasClientApiHistoryChangeEventHandler = (
  e: GasClientApiHistoryChangeEvent
) => void;

export type GasClientApiHistoryParams = [
  state: object | null,
  params: { [key: string]: string | string[] },
  hash: string | null
];

export type GasClientApiHistory = {
  push(...params: GasClientApiHistoryParams): void;
  replace(...params: GasClientApiHistoryParams): void;
  setChangeHandler(fn: GasClientApiHistoryChangeEventHandler | null): void;
};

export type GasClientApiHost = {
  origin: string;
  close(): void;
  setHeight(value: number): void;
  setWidth(value: number): void;
  editor: {
    focus(): void;
  };
};

export type GasClientApiUrl = {
  getLocation(fn: (e: GasClientApiLocation) => void): void;
};

export type GasClientApiRunFailureFn = (
  error: Error,
  userObject?: object
) => void;
export type GasClientApiRunSuccessFn = (
  result: any,
  userObject?: object
) => void;

export interface GasClientApiRun {
  withFailureHandler(fn: GasClientApiRunFailureFn | null): this;
  withSuccessHandler(fn: GasClientApiRunSuccessFn | null): this;
  withUserObject(userObject: object | null): this;
}

export type GasClientApiRunMethods = {
  [key: string]: (...params: any[]) => void;
};

export type GasServerApiRunMethods = {
  [key: string]: (...params: any[]) => any;
};

export type GasServerToClientApiRunMethods<T extends GasServerApiRunMethods> = {
  [P in keyof T]: (...p: Parameters<T[P]>) => void;
};

export type GoogleClientApi<T extends GasClientApiRunMethods = {}> = {
  script: {
    history: GasClientApiHistory;
    host: GasClientApiHost;
    url: GasClientApiUrl;
    run: GasClientApiRun & T;
  };
};

declare global {
  interface Window {
    google: GoogleClientApi;
  }
}
