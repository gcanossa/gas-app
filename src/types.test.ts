import { describe, test } from "vitest";
import {
  GasServerApiRunMethods,
  GasServerToClientApiRunMethods,
} from "./types";
import { GasClientApiRunMethodsMocks, initMocks } from "./mocking";
import { createBridge } from "./client";

describe.skip("type inference", () => {
  test("inference check", async () => {
    const serverApi = {
      sum(a: number, b: number): number {
        return a + b;
      },
      print(s: string): void {},
      wait(range: [number, number]): Promise<void> {
        return Promise.resolve();
      },
    } satisfies GasServerApiRunMethods;

    const serverCoreApi = {
      mul(a: number, b: number): number {
        return a * b;
      },
      display(s: string): void {},
    } satisfies GasServerApiRunMethods;

    const mocks: GasClientApiRunMethodsMocks<typeof serverApi> = {
      async sum(a: number, b: number): Promise<number> {
        return a + b;
      },
      async print(s: string): Promise<void> {},
      wait(range: [number, number]): Promise<void> {
        return Promise.resolve();
      },
    };
    const mocksCore: GasClientApiRunMethodsMocks<typeof serverCoreApi> = {
      async mul(a: number, b: number): Promise<number> {
        return a * b;
      },
      async display(s: string): Promise<void> {},
    };

    initMocks<typeof serverApi>(mocks, mocksCore);

    const clientApi: GasServerToClientApiRunMethods<typeof serverApi> = {
      sum(a: number, b: number): void {},
      print(s: string): void {},
      wait(range: [number, number]): void {},
    };

    const bridge = createBridge<typeof serverApi>();
    bridge.sum(1, 2);
    bridge.ctx_sum({}, 1, 2);

    const coreBridge = createBridge<typeof serverCoreApi>();
    coreBridge.mul(1, 2);
    coreBridge.ctx_mul({}, 1, 2);
  });
});
