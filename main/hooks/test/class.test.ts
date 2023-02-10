import { assertEquals, assertStrictEquals, it } from './dependencies.ts';
import { HookContext, hooks, middleware, NextFunction } from '../src/index.ts';

interface Dummy {
  sayHi(name: string): Promise<string>;
  addOne(number: number): Promise<number>;
}

const createDummyClass = () => {
  return class DummyClass implements Dummy {
    sayHi(name: string) {
      return Promise.resolve(`Hi ${name}`);
    }

    addOne(number: number) {
      return Promise.resolve(number + 1);
    }
  };
};

it('hooking object on class adds to the prototype', async () => {
  const DummyClass = createDummyClass();

  hooks(DummyClass, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        assertEquals(ctx.toJSON(), {
          arguments: ['David'],
          method: 'sayHi',
          name: 'David',
          self: instance,
        });

        await next();

        ctx.result += '?';
      },
    ]).params('name'),

    addOne: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      },
    ]),
  });

  const instance = new DummyClass();

  assertEquals(await instance.sayHi('David'), 'Hi David?');
  assertEquals(await instance.addOne(1), 3);
});

it('hooking object works on function that has property', async () => {
  const app = function () {};

  app.sayHi = (name: string) => `Hello ${name}`;

  hooks(app as any, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      },
    ]).params('name'),
  });

  assertEquals(await app.sayHi('David'), 'Hello David?');
});

it('works with inheritance', async () => {
  const DummyClass = createDummyClass();

  const first = async (ctx: HookContext, next: NextFunction) => {
    assertEquals(ctx.arguments, ['David']);
    assertEquals(ctx.method, 'sayHi');
    assertEquals(ctx.self, instance);

    await next();

    ctx.result += '?';
  };
  const second = async (ctx: HookContext, next: NextFunction) => {
    await next();

    ctx.result += '!';
  };

  hooks(DummyClass, {
    sayHi: middleware([first]),
  });

  class OtherDummy extends DummyClass {}

  hooks(OtherDummy, {
    sayHi: middleware([second]),
  });

  const instance = new OtherDummy();

  assertStrictEquals(await instance.sayHi('David'), 'Hi David!?');
});

it('works with multiple context updaters', async () => {
  const DummyClass = createDummyClass();

  hooks(DummyClass, {
    sayHi: middleware([
      async (ctx, next) => {
        assertEquals(ctx.name, 'Dave');

        ctx.name = 'Changed';

        await next();
      },
    ]).params('name'),
  });

  class OtherDummy extends DummyClass {}

  hooks(OtherDummy, {
    sayHi: middleware([
      async (ctx, next) => {
        assertEquals(ctx.name, 'Changed');
        assertEquals(ctx.gna, 42);

        await next();
      },
    ]).props({ gna: 42 }),
  });

  const instance = new OtherDummy();

  hooks(instance, {
    sayHi: middleware([
      async (ctx, next) => {
        assertEquals(ctx.name, 'Changed');
        assertEquals(ctx.gna, 42);
        assertEquals(ctx.app, 'ok');

        await next();
      },
    ]).props({ app: 'ok' }),
  });

  assertEquals(await instance.sayHi('Dave'), 'Hi Changed');
});
