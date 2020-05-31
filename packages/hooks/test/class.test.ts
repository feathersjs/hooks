import { strict as assert } from 'assert';
import {
  hooks,
  middleware,
  HookContext,
  NextFunction,
  setContext
} from '../src';

interface Dummy {
  sayHi (name: string): Promise<string>;
  addOne (number: number): Promise<number>;
}

describe('class objectHooks', () => {
  let DummyClass: new () => Dummy;

  beforeEach(() => {
    DummyClass = class DummyClass implements Dummy {
      async sayHi (name: string) {
        return `Hi ${name}`;
      }

      async addOne (number: number) {
        return number + 1;
      }
    };
  });


  it('hooking object on class adds to the prototype', async () => {
    hooks(DummyClass, {
      sayHi: middleware([
        setContext.params('name'),
        async (ctx: HookContext, next: NextFunction) => {
          assert.deepStrictEqual(ctx, new DummyClass.prototype.sayHi.Context({
            arguments: ['David'],
            method: 'sayHi',
            name: 'David',
            self: instance
          }));

          await next();

          ctx.result += '?';
        }
      ]),

      addOne: middleware([
        async (ctx: HookContext, next: NextFunction) => {
          ctx.arguments[0] += 1;

          await next();
        }
      ])
    });

    const instance = new DummyClass();

    assert.strictEqual(await instance.sayHi('David'), 'Hi David?');
    assert.strictEqual(await instance.addOne(1), 3);
  });

  it('works with inheritance', async () => {
    const first = async (ctx: HookContext, next: NextFunction) => {
      assert.deepStrictEqual(ctx, new (OtherDummy.prototype.sayHi as any).Context({
        arguments: [ 'David' ],
        method: 'sayHi',
        self: instance
      }));

      await next();

      ctx.result += '?';
    };
    const second = async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += '!';
    };

    hooks(DummyClass, {
      sayHi: middleware([first])
    });

    class OtherDummy extends DummyClass {}

    hooks(OtherDummy, {
      sayHi: middleware([second])
    });

    const instance = new OtherDummy();

    assert.strictEqual(await instance.sayHi('David'), 'Hi David!?');
  });

  it('works with multiple context updaters', async () => {
    hooks(DummyClass, {
      sayHi: middleware([
        setContext.params('name'),
        async (ctx, next) => {
          assert.equal(ctx.name, 'Dave');

          ctx.name = 'Changed';

          await next();
        }
      ])
    });

    class OtherDummy extends DummyClass {}

    hooks(OtherDummy, {
      sayHi: [
        setContext.properties({ gna: 42 }),
        async (ctx, next) => {
          assert.equal(ctx.name, 'Changed');
          assert.equal(ctx.gna, 42);

          await next();
        }
      ]
    });

    const instance = new OtherDummy();

    hooks(instance, {
      sayHi: middleware([
        setContext.properties({ app: 'ok' }),
        async (ctx, next) => {
          assert.equal(ctx.name, 'Changed');
          assert.equal(ctx.gna, 42);
          assert.equal(ctx.app, 'ok');

          await next();
        }
      ])
    });

    assert.equal(await instance.sayHi('Dave'), 'Hi Changed');
  });
});
