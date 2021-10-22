import * as assert from "assert";
import { hooks, collect, HookContext, NextFunction, middleware } from "../src";

describe("collect utility for regular hooks", () => {
  it("collects hooks in order", async () => {
    class DummyClass {
      async create(data: any) {
        data.id = 1;
        return data;
      }
    }
    hooks(DummyClass, {
      create: middleware([
        collect({
          before: [
            (ctx: any) => {
              ctx.data.log.push("collect-1 : before : 1");
            },
            (ctx: any) => {
              ctx.data.log.push("collect-1 : before : 2");
            },
          ],
          after: [
            (ctx: any) => {
              ctx.data.log.push("collect-1 : after : 1");
            },
            (ctx: any) => {
              ctx.data.log.push("collect-1 : after : 2");
            },
          ],
          error: [],
        }),
        async (ctx: HookContext, next: NextFunction) => {
          ctx.data.log.push("async : before");
          await next();
          ctx.data.log.push("async : after");
        },
        collect({
          before: [
            (ctx: any) => {
              ctx.data.log.push("collect-2 : before:3");
            },
            (ctx: any) => {
              ctx.data.log.push("before : 4");
            },
          ],
          after: [
            (ctx: any) => {
              ctx.data.log.push("collect-2 : after : 3");
            },
            (ctx: any) => {
              ctx.data.log.push("collect-2 : after : 4");
            },
          ],
          error: [],
        }),
      ]).params("data"),
    });

    const service = new DummyClass();
    const value = await service.create({ name: "David", log: [] });

    assert.deepStrictEqual(value.log, [
      "collect-1 : before : 1",
      "collect-1 : before : 2",
      "async : before",
      "collect-2 : before : 3",
      "collect-2 : before : 4",
      "collect-2 : after : 3",
      "collect-2 : after : 4",
      "async : after",
      "collect-1 : after : 1",
      "collect-1 : after : 2",
    ]);
  });

  it.only("error hooks", async () => {
    class DummyClass {
      async create(data: any) {
        data.id = 1;
        return data;
      }
    }
    const collection = collect({
      before: [
        (ctx) => {
          console.log(ctx);
          throw new Error("in before hook");
        },
      ],
      after: [
        () => {
          throw new Error("in after hook");
        },
      ],
      error: [
        (ctx: any) => {
          console.log(ctx);
        },
      ],
    });
    hooks(DummyClass, {
      create: middleware([collection]).params("data"),
    });

    const service = new DummyClass();
    console.log("service");

    return service
      .create({ log: [] })
      .then((result) => {
        console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});
