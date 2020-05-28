import { strict as assert } from 'assert';
import { hooks, middleware, HookContext, NextFunction } from '../src';

interface HookableObject {
  test: string;
  sayHi (name: string): Promise<string>;
  addOne (number: number): Promise<number>;
}

describe('objectHooks', () => {
  let obj: HookableObject;

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
  });

  it('hooks object with hook methods, sets method name', async () => {
    const hookedObj = hooks(obj, {
      sayHi: middleware([async (ctx: HookContext, next: NextFunction) => {
        assert.equal(ctx.method, 'sayHi');
        assert.deepEqual(ctx, new (obj.sayHi as any).Context({
          arguments: [ 'David' ],
          method: 'sayHi',
          self: obj
        }));

        await next();

        ctx.result += '?';
      }]),
      addOne: middleware([async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }])
    });

    assert.strictEqual(obj, hookedObj);
    assert.strictEqual(await hookedObj.sayHi('David'), 'Hi David?');
    assert.strictEqual(await hookedObj.addOne(1), 3);
  });

  it('hooks object and allows to customize context for method', async () => {
    const hookedObj = hooks(obj, {
      sayHi: middleware([async (ctx: HookContext, next: NextFunction) => {
        assert.deepStrictEqual(ctx, new (obj.sayHi as any).Context({
          arguments: ['David'],
          method: 'sayHi',
          name: 'David',
          self: obj
        }));

        ctx.name = 'Dave';

        await next();

        ctx.result += '?';
      }]).params('name'),

      addOne: middleware([async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }])
    });

    assert.strictEqual(obj, hookedObj);
    assert.strictEqual(await hookedObj.sayHi('David'), 'Hi Dave?');
    assert.strictEqual(await hookedObj.addOne(1), 3);
  });

  it('hooking multiple times works properly', async () => {
    hooks(obj, {
      sayHi: middleware([async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      }])
    });

    hooks(obj, {
      sayHi: middleware([async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      }])
    });

    assert.strictEqual(await obj.sayHi('David'), 'Hi David?!');
  });

  it('throws an error when hooking invalid method', async () => {
    try {
      hooks(obj, {
        test: middleware([async (_ctx, next) => {
          await next();
        }])
      });
      assert.fail('Should never get here');
    } catch (error) {
      assert.strictEqual(error.message, `Can not apply hooks. 'test' is not a function`);
    }
  });

  it('works with object level hooks', async () => {
    hooks(obj, [
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      }
    ]);

    hooks(obj, {
      sayHi: middleware([async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      }])
    });

    assert.equal(await obj.sayHi('Dave'), 'Hi Dave?!');
  });
});
