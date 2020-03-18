import { strict as assert } from 'assert';
import { hooks, HookContext, NextFunction, middleware } from '../src/';

const CYCLES = 100000;
const getRuntime = async (callback: () => Promise<any>, cycles: number = CYCLES) => {
  const start = Date.now();

  for (let i = 0; i < cycles; i++) {
    await callback();
  }

  return Date.now() - start;
}

describe.skip('hook benchmark', () => {
  const hello = async (name: string, _params: any = {}) => {
    return `Hello ${name}`;
  };
  let baseline: number;

  before(async () => {
    baseline = await getRuntime(() => hello('Dave'));
  });

  it('benchmark', async () => {
    const getRuntime = async (callback: () => Promise<any>) => {
      const start = Date.now();

      for (let i = 0; i < 100000; i++) {
        await callback();
      }

      return Date.now() - start;
    }
    const hello = async (name: string, _params: any = {}) => {
      return `Hello ${name}`;
    };
    console.log('Baseline', await getRuntime(() => hello('Dave')));

    const hookHello1 = hooks(hello, middleware([]));
    console.log('Empty hooks', await getRuntime(() => hookHello1('Dave')));

    const hookHello2 = hooks(hello, middleware([
      async (_ctx: HookContext, next: NextFunction) => {
        await next();
      }
    ]));

    console.log('Single simple hook', await getRuntime(() => hookHello2('Dave')));

    const hookHello3 = hooks(hello, middleware([
      async (_ctx: HookContext, next: NextFunction) => {
        await next();
      }
    ]).params('name'));

    console.log('Single hook and withParams', await getRuntime(() => hookHello3('Dave')));
    assert.ok(baseline);
  });

  // it('baseline vs empty hooks', async () => {
  //   const hookHello = hooks(hello, []);

  //   console.log(baseline);
  //   console.log(await getRuntime(() => hookHello('Dave')));
  //   assert.ok(true);
  // });

  // it('baseline vs one simple hook', async () => {
  //   const hookHello = hooks(hello, [
  //     async (_ctx: HookContext, next: NextFunction) => {
  //       await next();
  //     }
  //   ]);

  //   console.log(await getRuntime(() => hookHello('Dave')));
  // });

  // it('baseline vs one simple hook and params', async () => {
  //   assert.ok(baseline);

  //   const hookHello = hooks(hello, {
  //     middleware: [
  //       async (_ctx: HookContext, next: NextFunction) => {
  //         await next();
  //       }
  //     ],
  //     context: [withParams(), withParams('name'), withParams()]
  //   });

  //   console.log(await getRuntime(() => hookHello('Dave')));
  // });
});
