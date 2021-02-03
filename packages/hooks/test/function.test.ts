import { strict as assert } from 'assert';
import {
  hooks,
  middleware,
  getManager,
  HookContext,
  NextFunction,
  setMiddleware,
  functionHooks
} from '../src';

describe('functionHooks', () => {
  const hello = async (name?: string, _params: any = {}) => {
    return `Hello ${name}`;
  };

  it('returns a new function, registers hooks', () => {
    const fn = hooks(hello, []);

    assert.notDeepEqual(fn, hello);
    assert.ok(getManager(fn) !== null);
  });

  it('throws an error with non function', () => {
    assert.throws(() => functionHooks({}, middleware([])));
  })

  it('can override arguments, has context', async () => {
    const addYou = async (ctx: HookContext, next: NextFunction) => {
      assert.ok(ctx instanceof HookContext);
      assert.deepStrictEqual(ctx.arguments, [ 'There' ]);
      ctx.arguments[0] += ' You';

      await next();
    };

    const fn = hooks(hello, middleware([ addYou ]));
    const res = await fn('There');

    assert.strictEqual(res, 'Hello There You');
  });

  it('has fn.original', async () => {
    const fn = hooks(hello, middleware([
      async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += ' You';

        await next();
      }
    ]));

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

    const fn = hooks(hello, middleware([ updateResult ]));
    const res = await fn('There');

    assert.strictEqual(res, 'Hello Dave');
  });

  it('can set context.result to undefined, skips method call, returns undefined', async () => {
    const hello = async (_name: string) => {
      throw new Error('Should never get here');
    };
    const updateResult = async (ctx: HookContext, next: NextFunction) => {
      ctx.result = undefined;

      await next();
    };

    const fn = hooks(hello, middleware([ updateResult ]));
    const res = await fn('There');

    assert.strictEqual(res, undefined);
  });

  it('deleting context.result, does not skip method call', async () => {
    const hello = async (name: string) => {
      return name;
    };
    const updateResult = async (ctx: HookContext, next: NextFunction) => {
      ctx.result = 'Dave';

      await next();
    };
    const deleteResult = async (ctx: HookContext, next: NextFunction) => {
      delete ctx.result;

      await next();
    };

    const fn = hooks(hello, middleware([
      updateResult,
      deleteResult
    ]));
    const res = await fn('There');

    assert.strictEqual(res, 'There');
  });

  it('can override context.result after', async () => {
    const updateResult = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += ' You!';
    };

    const fn = hooks(hello, middleware([ updateResult ]));
    const res = await fn('There');

    assert.strictEqual(res, 'Hello There You!');
  });

  it('maintains the function context and sets context.self', async () => {
    const hook = async function (this: any, context: HookContext, next: NextFunction) {
      assert.strictEqual(obj, this);
      assert.strictEqual(context.self, obj);
      await next();
    };
    const obj: any = {
      message: 'Hi',

      sayHi: hooks(async function (this: any, name: string) {
        return `${this.message} ${name}`;
      }, middleware([ hook ]))
    };
    const res = await obj.sayHi('Dave');

    assert.strictEqual(res, 'Hi Dave');
  });

  it('uses hooks from context object and its prototypes', async () => {
    const o1 = { message: 'Hi' };
    const o2 = Object.create(o1);

    setMiddleware(o1, [async (ctx: HookContext, next: NextFunction) => {
      ctx.arguments[0] += ' o1';

      await next();
    }]);

    setMiddleware(o2, [async (ctx, next) => {
      ctx.arguments[0] += ' o2';

      await next();
    }]);

    o2.sayHi = hooks(async function (this: any, name: string) {
      return `${this.message} ${name}`;
    }, middleware([async (ctx, next) => {
      ctx.arguments[0] += ' fn';

      await next();
    }]));

    const res = await o2.sayHi('Dave');

    assert.strictEqual(res, 'Hi Dave o1 o2 fn');
  });

  it('wraps an existing hooked function properly', async () => {
    const one = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += ' One';
    };
    const two = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += ' Two';
    };
    const three = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += ' Three';
    };
    const first = hooks(hello, middleware([ one, two ]));
    const second = hooks(first, middleware([ three ]));

    assert.deepEqual(getManager(second).getMiddleware(), [ one, two, three ]);

    const result = await second('Dave');

    assert.strictEqual(result, 'Hello Dave Three Two One');
  });

  it('chains context and default initializers', async () => {
    const first = hooks(hello, middleware([], {
      params: [ 'name' ],
      defaults () {
        return { defaulting: true };
      }
    }));
    const second = hooks(first, middleware([
      async (ctx, next) => {
        assert.ok(ctx.defaulting);
        ctx.name += ctx.testing;
        await next();
      }
    ]).props({ testing: ' test value' }));

    const result = await second('Dave');

    assert.equal(result, 'Hello Dave test value');
  });

  it('creates context with params and converts to arguments', async () => {
    const fn = hooks(hello, middleware([
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');

        ctx.name = 'Changed';

        await next();
      }
    ]).params('name'));

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('assigns props to context', async () => {
    const fn = hooks(hello, middleware([
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');
        assert.equal(ctx.dev, true);

        ctx.name = 'Changed';

        await next();
      }
    ]).params('name').props({ dev: true }));

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('assigns props to context by options', async () => {
    const fn = hooks(hello, middleware([
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');
        assert.equal(ctx.dev, true);

        ctx.name = 'Changed';

        await next();
      }
    ], {
      params: ['name'],
      props: { dev: true }
    }));

    assert.equal(await fn('Dave'), 'Hello Changed');
  });

  it('ctx.arguments is configurable with named params', async () => {
    const modifyArgs = async (ctx: HookContext, next: NextFunction) => {
      ctx.arguments[0] = 'Changed';
      ctx.arguments.push('no');

      assert.equal(ctx.name, ctx.arguments[0]);

      await next();
    };

    const fn = hooks(hello, middleware([ modifyArgs ]).params('name'));

    const customContext = fn.createContext();
    const resultContext = await fn('Daffl', {}, customContext);

    assert.equal(resultContext, customContext);
    assert.deepEqual(resultContext, fn.createContext({
      arguments: ['Changed', {}, 'no'],
      name: 'Changed',
      result: 'Hello Changed'
    }));
  });

  it('can take and return an existing HookContext', async () => {
    const message = 'Custom message';
    const fn = hooks(hello, middleware([
      async (ctx, next) => {
        assert.equal(ctx.name, 'Dave');
        assert.equal(ctx.message, message);

        ctx.name = 'Changed';
        await next();
      }
    ]).params('name'));

    const customContext = fn.createContext({ message });
    const resultContext: HookContext = await fn('Dave', {}, customContext);

    assert.equal(resultContext, customContext);
    assert.deepEqual(resultContext, fn.createContext({
      arguments: ['Changed', {}],
      message: 'Custom message',
      name: 'Changed',
      result: 'Hello Changed'
    }));
  });

  it('calls middleware one time', async () => {
    let called = 0;

    const sayHi = hooks((name: any) => `Hi ${name}`, middleware([
      async (_context, next) => {
        called++;
        await next();
      }
    ]));

    const exclamation = hooks(sayHi, middleware([
      async (context, next) => {
        await next();
        context.result += '!';
      }
    ]));

    const result = await exclamation('Bertho');

    assert.equal(result, 'Hi Bertho!');
    assert.equal(called, 1);
  });

  it('conserves method properties', async () => {
    const TEST = Symbol('test');
    const hello = (name: any) => `Hi ${name}`;
    (hello as any)[TEST] = true;

    const sayHi = hooks(hello, middleware([
      async (context, next) => {
        await next();
        context.result += '!';
      }
    ]));

    const result = await sayHi('Bertho');

    assert.equal(result, 'Hi Bertho!');
    assert.equal((sayHi as any)[TEST], (hello as any)[TEST]);
  });

  it('works with array as middleware', async () => {
    const TEST = Symbol('test');
    const hello = (name: any) => `Hi ${name}`;
    (hello as any)[TEST] = true;

    const sayHi = hooks(hello, [
      async (context, next) => {
        await next();
        context.result += '!';
      }
    ]);

    const result = await sayHi('Bertho');

    assert.equal(result, 'Hi Bertho!');
    assert.equal((sayHi as any)[TEST], (hello as any)[TEST]);
  });

  it('context has own properties', async () => {
    const fn = hooks(hello, middleware([]).params('name'));

    const customContext = fn.createContext({ message: 'Hi !' });
    const resultContext: HookContext = await fn('Dave', {}, customContext);

    assert.deepEqual(Object.keys(resultContext), ['message', 'name', 'arguments', 'result']);
  });

  it('same params and props throw an error', async () => {
    const hello = async (name?: string) => {
      return `Hello ${name}`;
    };
    assert.throws(() => hooks(hello, middleware([]).params('name').props({ name: 'David' })), {
      message: `Hooks can not have a property and param named 'name'. Use .defaults instead.`
    });
  });

  it('creates context with default params', async () => {
    const fn = hooks(hello, middleware([
      async (ctx, next) => {
        assert.deepEqual(ctx.params, {});

        await next();
      }]).params('name', 'params').defaults(() => {
        return {
          name: 'Bertho',
          params: {}
        }
      })
    );

    assert.equal(await fn('Dave'), 'Hello Dave');
    assert.equal(await fn(), 'Hello Bertho');
  });
});
