import { strict as assert } from 'assert';
import {
  hooks,
  HookContext,
  NextFunction,
  middleware,
  contextParams,
  contextProperties
} from '../src/';

const CYCLES = 100000;
const getRuntime = async (callback: () => Promise<any>) => {
  const start = Date.now();

  for (let i = 0; i < CYCLES; i++) {
    await callback();
  }

  return Date.now() - start;
}

describe('hook benchmark', () => {
  const hello = async (name: string, _params: any = {}) => {
    return `Hello ${name}`;
  };
  let baseline: number;
  let threshold: number;

  before(async () => {
    baseline = await getRuntime(() => hello('Dave'));
    threshold = baseline * 25; // TODO might be improved further
  });

  it('empty hook', async () => {
    const hookHello1 = hooks(hello, middleware([]));
    const runtime = await getRuntime(() => hookHello1('Dave'));

    assert.ok(runtime < threshold, `Runtime is ${runtime}ms, threshold is ${threshold}ms`);
  });

  it('single simple hook', async () => {
    const hookHello = hooks(hello, middleware([
      async (_ctx: HookContext, next: NextFunction) => {
        await next();
      }
    ]));
    const runtime = await getRuntime(() => hookHello('Dave'));

    assert.ok(runtime < threshold, `Runtime is ${runtime}ms, threshold is ${threshold}ms`);
  });

  it('single hook, withParams and props', async () => {
    const hookHello = hooks(hello, middleware([
      contextParams('name'),
      contextProperties({ dave: true }),
      async (_ctx: HookContext, next: NextFunction) => {
        await next();
      }
    ]));

    const runtime = await getRuntime(() => hookHello('Dave'));

    assert.ok(runtime < threshold, `Runtime is ${runtime}ms, threshold is ${threshold}ms`);
  });
});
