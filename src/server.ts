import { GasServerApiRunMethods } from "./types";

export const __GAS_CORE__: GasServerApiRunMethods = {};

export function gas_core_init<T extends GasServerApiRunMethods>(methods: T) {
  Object.keys(methods).map((name) => {
    __GAS_CORE__[name] = methods[name].bind(null);
  });
}

export function gas_core_invoke(name: string, ...params: any[]): any {
  if (name in __GAS_CORE__ === false)
    throw new Error(`Unknown function ${name}`);

  return __GAS_CORE__[name].apply(null, params);
}

export function gas_include(filename: string, params?: { [key: string]: any }) {
  const tpl = HtmlService.createTemplateFromFile(filename);

  if (!!params) Object.keys(params).map((key) => (tpl[key] = params[key]));

  return tpl.evaluate().getContent();
}
