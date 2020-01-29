import { strict as assert } from 'assert';
import {hooks, HookContext, NextFunction, withParams, withProps} from '../src';

describe('objectHooks', () => {
  let obj: any;
  let DummyClass: any;

  beforeEach(() => {
    obj = {
      test: 'me',

      async sayHi (name: string) {
        return `Hi ${name}`;
      },

      async addOne (number: number) {
        return number + 1;
      }
    };

    DummyClass = class DummyClass {
      async sayHi (name: string) {
        return `Hi ${name}`;
      }

      async addOne (number: number) {
        return number + 1;
      }
    };
  });

  it('hooks object with hook methods, sets method name', async () => {
    const hookedObj = hooks(obj, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        assert.deepEqual(ctx, new HookContext({
          self: obj,
          method: 'sayHi',
          arguments: [ 'David' ]
        }));

        await next();

        ctx.result += '?';
      }],
      addOne: [async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }]
    });

    assert.strictEqual(obj, hookedObj);
    assert.strictEqual(await hookedObj.sayHi('David'), 'Hi David?');
    assert.strictEqual(await hookedObj.addOne(1), 3);
  });

  it('hooks object and allows to customize context for method', async () => {
    const hookedObj = hooks(obj, {
      sayHi: {
        middleware: [async (ctx: HookContext, next: NextFunction) => {
          assert.deepStrictEqual(ctx, new HookContext({
            method: 'sayHi',
            name: 'David',
            self: obj
          }));

          ctx.name = 'Dave';

          await next();

          ctx.result += '?';
        }],
        context: withParams('name')
      },
      addOne: [async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }]
    });

    assert.strictEqual(obj, hookedObj);
    assert.strictEqual(await hookedObj.sayHi('David'), 'Hi Dave?');
    assert.strictEqual(await hookedObj.addOne(1), 3);
  });

  it('hooking multiple times works properly', async () => {
    hooks(obj, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      }]
    });

    hooks(obj, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      }]
    });

    assert.strictEqual(await obj.sayHi('David'), 'Hi David?!');
  });

  it('throws an error when hooking invalid method', async () => {
    try {
      hooks(obj, {
        test: [async (_ctx, next) => {
          await next();
        }]
      });
      assert.fail('Should never get here');
    } catch (error) {
      assert.strictEqual(error.message, `Can not apply hooks. 'test' is not a function`);
    }
  });

  it('hooking object on class adds to the prototype', async () => {
    hooks(DummyClass, {
      sayHi: {
        middleware: [async (ctx: HookContext, next: NextFunction) => {
          assert.deepStrictEqual(ctx, new HookContext({
            self: instance,
            method: 'sayHi',
            name: 'David'
          }));

          await next();

          ctx.result += '?';
        }],
        context: withParams('name')
      },
      addOne: [async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }]
    });

    const instance = new DummyClass();

    assert.strictEqual(await instance.sayHi('David'), 'Hi David?');
    assert.strictEqual(await instance.addOne(1), 3);
  });

  it('works with inheritance', async () => {
    hooks(DummyClass, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        assert.deepStrictEqual(ctx, new HookContext({
          method: 'sayHi',
          arguments: [ 'David' ],
          self: instance
        }));

        await next();

        ctx.result += '?';
      }]
    });

    class OtherDummy extends DummyClass {}

    hooks(OtherDummy, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      }]
    });

    const instance = new OtherDummy();

    assert.strictEqual(await instance.sayHi('David'), 'Hi David?!');
  });

  it('works with object level hooks', async () => {
    hooks(obj, [
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      }
    ]);

    hooks(obj, {
      sayHi: [async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      }]
    });

    assert.equal(await obj.sayHi('Dave'), 'Hi Dave?!');
  });

  it('works with multiple context updaters', async () => {
    hooks(DummyClass, {
      sayHi: {
        middleware: [
          async (ctx, next) => {
            assert.equal(ctx.name, 'Dave');
            assert.equal(ctx.gna, 42);
            assert.equal(ctx.app, 'ok');

            ctx.name = 'Changed';

            await next();
          }
        ],
        context: withParams('name')
      }
    });

    class OtherDummy extends DummyClass {}

    hooks(OtherDummy, {
      sayHi: {
        middleware: [
          async (ctx, next) => {
            assert.equal(ctx.name, 'Dave');
            assert.equal(ctx.gna, 42);
            assert.equal(ctx.app, 'ok');

            await next();
          }
        ],
        context: withProps({ gna: 42 })
      }
    });

    const instance = new OtherDummy();

    hooks(instance, {
      sayHi: {
        middleware: [
          async (ctx, next) => {
            assert.equal(ctx.name, 'Dave');
            assert.equal(ctx.gna, 42);
            assert.equal(ctx.app, 'ok');

            await next();
          }
        ],
        context: withProps({ app: 'ok' })
      }
    });

    assert.equal(await instance.sayHi('Dave'), 'Hi Changed');
  });
});
