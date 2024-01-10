import { GasServerApiRunMethods } from "./types";

export function include(
  filename: string,
  params?: { [key: string]: any }
): string {
  const tpl = HtmlService.createTemplateFromFile(filename);

  if (!!params) Object.keys(params).map((key) => (tpl[key] = params[key]));

  return tpl.evaluate().getContent();
}

export type GasApp = {
  invoke(name: string, ...params: any[]): any;
};

export function createGasApp<T extends GasServerApiRunMethods>(
  methods: T
): GasApp {
  const app: GasServerApiRunMethods = Object.keys(methods).reduce(
    (acc, name) => ({
      ...acc,
      [name]: methods[name].bind(null),
    }),
    {}
  );

  return {
    invoke(name: string, ...params: any[]): any {
      if (name in app === false) throw new Error(`Unknown function ${name}`);

      return app[name].apply(null, params);
    },
  };
}
