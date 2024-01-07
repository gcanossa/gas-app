import { describe, expect, test } from "vitest";
import {
  GasServerApiRunMethods,
  GasServerToClientApiRunMethods,
  GoogleClientApi,
} from "./types";
import { GasClientApiRunMethodsMocks, initMocks } from "./mocking";
import { createBridge, createCoreBridge } from "./client";

describe("type inference", () => {
  test("inference check", async () =>
    new Promise<void>(async (done) => {
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

      const hdl = window.google as GoogleClientApi<
        GasServerToClientApiRunMethods<typeof serverApi>
      >;
      hdl.script.run
        .withUserObject({ text: "hello" })
        .withSuccessHandler((res, obj) => {
          expect(res).toBe(3);
          expect(obj).toEqual({ text: "hello" });
          done();
        })
        .sum(1, 2);

      const bridge = createBridge<typeof serverApi>();
      expect(await bridge.sum(1, 2)).toEqual([3, undefined]);
      expect(await bridge.ctx_sum({ text: "hello" }, 1, 2)).toEqual([
        3,
        { text: "hello" },
      ]);

      const coreBridge = createCoreBridge<typeof serverCoreApi>();
      expect(await coreBridge.mul(2, 3)).toEqual([6, undefined]);
      expect(await coreBridge.ctx_mul({ text: "hello" }, 2, 3)).toEqual([
        6,
        { text: "hello" },
      ]);
    }));
});
