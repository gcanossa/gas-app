import { GasClientApiRunMethodsMocks, initMocks } from "./mocking";
import { createBridge, createCoreBridge } from "./client";
import { GasServerApiRunMethods } from "./types";
import { gas_core_init } from "./server";

function sum(a: number, b: number) {
  return a + b;
}

function print(s: string) {
  console.log(`print: ${s}`);
}

function wait(range: [number, number]): Promise<void> {
  return new Promise<void>((done) => {
    setTimeout(() => {
      done();
    }, Math.random() * (range[1] - range[0]) + range[0]);
  });
}

function mul(a: number, b: number) {
  return a * b;
}

function display(s: string) {
  console.log(`display: ${s}`);
}

function test() {
  gas_core_init({ mul, display });
}
