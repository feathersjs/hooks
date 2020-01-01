import { strict as assert } from 'assert';
import {
  hooks, ORIGINAL, HOOKS, CONTEXT,
  HookContext, initContext, createContext,
  functionHooks, NextFunction
} from '../src/';

describe('functionHooks', () => {
  const hello = async (name: string) => {
    return `Hello ${name}`;
  };

  it('throws an error when not using with a function', () => {
    try {
      functionHooks('jfkdls', []);
      assert.fail('Should never get here');
    } catch (error) {
      assert.strictEqual(error.message, 'Can not apply hooks to non-function');
    }
  });

  it('returns a new function, sets ORIGINAL, HOOKS and CONTEXT', () => {
    const fn = hooks(hello, []) as any;

    assert.notDeepEqual(fn, hello);
    assert.deepStrictEqual(fn[HOOKS], []);
    assert.deepEqual(fn[ORIGINAL], hello);
    assert.ok(fn[CONTEXT]);
  });

  it('can override arguments, has context', async () => {
    const addYou = async (ctx: HookContext, next: NextFunction) => {
      assert.ok(ctx instanceof HookContext);
      assert.deepStrictEqual(ctx.arguments, [ 'There' ]);
      ctx.arguments[0] += ' You';

      await next();
    };

    const fn = hooks(hello, [ addYou ]);
    const res = await fn('There');

    assert.strictEqual(res, 'Hello There You');
  });

  it('can override context.result before, skips method call', async () => {
    const hello = async (_name: string) => {
      throw new Error('Should never get here');
    };
    const updateResult = async (ctx: HookContext, next: NextFunction) => {
      ctx.result = 'Hello Dave';

      await next();
    };

    const fn = hooks(hello, [ updateResult ]);
    const res = await fn('There');

    assert.strictEqual(res, 'Hello Dave');
  });

  it('can override context.result after', async () => {
    const updateResult = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += ' You!';
    };

    const fn = hooks(hello, [ updateResult ]);
    const res = await fn('There');

    assert.strictEqual(res, 'Hello There You!');
  });

  it('maintains the function context', async () => {
    const hook = async function (this: any, _ctx: HookContext, next: NextFunction) {
      assert.strictEqual(obj, this);
      await next();
    };
    const obj = {
      message: 'Hi',

      sayHi: hooks(async function (this: any, name: string) {
        return `${this.message} ${name}`;
      }, [ hook ])
    };
    const res = await obj.sayHi('Dave');

    assert.strictEqual(res, 'Hi Dave');
  });

  it('adds additional hooks to an existing function, uses original', async () => {
    const first = hooks(hello, [
      async (ctx, next) => {
        await next();

        ctx.result += ' First';
      }
    ]);
    const second = hooks(first, [
      async (ctx, next) => {
        await next();

        ctx.result += ' Second';
      }
    ]);

    assert.deepEqual((first as any)[ORIGINAL], hello);
    assert.deepEqual((second as any)[ORIGINAL], hello);
    assert.strictEqual((second as any)[HOOKS].length, 2);

    const result = await second('Dave');

    assert.strictEqual(result, 'Hello Dave Second First');
  });

  it('creates context with params and converts to arguments', async () => {
    const fn = hooks(hello, [
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');

        ctx.name = 'Changed';

        await next();
      }
    ], initContext('name'));

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('with named context ctx.arguments is frozen', async () => {
    const modifyArgs = async (ctx: HookContext, next: NextFunction) => {
      ctx.arguments[0] = 'Test';

      await next();
    };

    const fn = hooks(hello, [ modifyArgs ], initContext('name'));

    await assert.rejects(() => fn('There'), {
      message: `Cannot assign to read only property '0' of object '[object Array]'`
    });
  });

  it('uses a custom initContext', async () => {
    const checkContext = async (ctx: HookContext, next: NextFunction) => {
      assert.deepEqual(ctx.toJSON(), {
        arguments: [ 'There' ],
        test: 'me'
      });
      await next();
    };

    const fn = hooks(hello, [ checkContext ], () => {
      const ctx = new HookContext();

      ctx.test = 'me';

      return ctx;
    });
    const res = await fn('There');

    assert.strictEqual(res, 'Hello There');
  });

  it('can create and return an existing context', async () => {
    const message = 'Custom message';
    const fn = hooks(hello, [
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');
        assert.equal(ctx.message, message);

        ctx.name = 'Changed';
        await next();
      }
    ], initContext('name'));

    const customContext = createContext(fn, { message });
    // @ts-ignore
    const resultContext = await fn('Dave', customContext);

    assert.equal(resultContext, customContext);
    assert.deepEqual(resultContext.toJSON(), {
      message: 'Custom message',
      name: 'Changed',
      result: 'Hello Changed'
    });
  });
});
