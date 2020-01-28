import { strict as assert } from 'assert';
import {
  hooks, HookContext, functionHooks,
  NextFunction, getMiddleware, registerMiddleware,
  withParams, withProps
} from '../src/';

describe('functionHooks', () => {
  const hello = async (name: string, _params: any = {}) => {
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

  it('returns a new function, registers hooks', () => {
    const fn = hooks(hello, []) as any;

    assert.notDeepEqual(fn, hello);
    assert.deepEqual(getMiddleware(fn), []);
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

  it('has fn.original', async () => {
    const fn = hooks(hello, [
      async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += ' You';

        await next();
      }
    ]);

    assert.equal(typeof fn.original, 'function');

    assert.equal(await fn.original('Dave'), 'Hello Dave');
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

  it('maintains the function context and sets context.self', async () => {
    const hook = async function (this: any, context: HookContext, next: NextFunction) {
      assert.strictEqual(obj, this);
      assert.strictEqual(context.self, obj);
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

  it('uses hooks from context object and its prototypes', async () => {
    const o1 = { message: 'Hi' };
    const o2 = Object.create(o1);

    registerMiddleware(o1, [async (ctx, next) => {
      ctx.arguments[0] += ' o1';

      await next();
    }]);

    registerMiddleware(o2, [async (ctx, next) => {
      ctx.arguments[0] += ' o2';

      await next();
    }]);

    o2.sayHi = hooks(async function (this: any, name: string) {
      return `${this.message} ${name}`;
    }, [async (ctx, next) => {
      ctx.arguments[0] += ' fn';

      await next();
    }]);

    const res = await o2.sayHi('Dave');

    assert.strictEqual(res, 'Hi Dave o1 o2 fn');
  });

  it('wraps an existing hooked function properly', async () => {
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

    const result = await second('Dave');

    assert.strictEqual(result, 'Hello Dave First Second');
  });

  it('creates context with params and converts to arguments', async () => {
    const fn = hooks(hello, {
      middleware: [
        async (ctx, next) => {
          assert.equal(ctx.name, 'Dave');

          ctx.name = 'Changed';

          await next();
        }
      ],
      context: withParams('name')
    });

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('creates context with default params', async () => {
    const fn = hooks(hello, {
      middleware: [
        async (ctx, next) => {
          assert.equal(ctx.name, 'Dave');
          assert.deepEqual(ctx.params, {});

          ctx.name = 'Changed';

          await next();
        }
      ],
      context: withParams('name', ['params', {}])
    });

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('assigns props to context', async () => {
    const fn = hooks(hello, {
      middleware: [
        async (ctx, next) => {
          assert.equal(ctx.name, 'Dave');
          assert.equal(ctx.dev, true);

          ctx.name = 'Changed';

          await next();
        }
      ],
      context: [withParams('name'), withProps({ dev: true })]
    });

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('with named context ctx.arguments is frozen', async () => {
    const modifyArgs = async (ctx: HookContext, next: NextFunction) => {
      ctx.arguments[0] = 'Test';

      await next();
    };

    const fn = hooks(hello, {
      middleware: [ modifyArgs ],
      context: withParams('name')
    });

    await assert.rejects(() => fn('There'), {
      message: `Cannot assign to read only property '0' of object '[object Array]'`
    });
  });

  it('can take and return an existing HookContext', async () => {
    const message = 'Custom message';
    const fn = hooks(hello, {
      middleware: [
        async (ctx, next) => {
          assert.equal(ctx.name, 'Dave');
          assert.equal(ctx.message, message);

          ctx.name = 'Changed';
          await next();
        }
      ],
      context: withParams('name')
    });

    const customContext = new HookContext({ message });
    const resultContext: HookContext = await fn('Dave', {}, customContext);

    assert.equal(resultContext, customContext);
    assert.deepEqual(resultContext, new HookContext({
      message: 'Custom message',
      name: 'Changed',
      result: 'Hello Changed'
    }));
  });

  it('calls middleware one time', async () => {
    let called = 0;

    const sayHi = hooks((name: any) => `Hi ${name}`, [
      async (_context, next) => {
        called++;
        await next();
      }
    ]);

    const exclamation = hooks(sayHi, [
      async (context, next) => {
        await next();
        context.result += '!';
      }
    ]);

    const result = await exclamation('Bertho');

    assert.equal(result, 'Hi Bertho!');
    assert.equal(called, 1);
  });
});
