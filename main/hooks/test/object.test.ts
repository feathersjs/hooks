import { assertEquals, assertStrictEquals, assertThrows, it } from './dependencies.ts';
import { HookContext, hooks, middleware, NextFunction } from '../src/index.ts';

interface HookableObject {
  test: string;
  sayHi(name: string): Promise<string>;
  addOne(number: number): Promise<number>;
}

const getObject = (): HookableObject => ({
  test: 'me',

  async sayHi(name: string) {
    return `Hi ${name}`;
  },

  async addOne(number: number) {
    return number + 1;
  },
});

it('hooks object with hook methods, sets method name', async () => {
  const obj = getObject();

  const hookedObj = hooks(obj, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        assertEquals(ctx.arguments, ['David']);
        assertEquals(ctx.method, 'sayHi');
        assertEquals(ctx.self, obj);

        await next();

        ctx.result += '?';
      },
    ]),
    addOne: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      },
    ]),
  });

  assertStrictEquals(obj, hookedObj);
  assertEquals(await hookedObj.sayHi('David'), 'Hi David?');
  assertEquals(await hookedObj.addOne(1), 3);
});

it('hooks object and allows to customize context for method', async () => {
  const obj = getObject();
  const hookedObj = hooks(obj, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        assertEquals(ctx.arguments, ['David']);
        assertEquals(ctx.method, 'sayHi');
        assertEquals(ctx.name, 'David');
        assertEquals(ctx.self, obj);

        ctx.name = 'Dave';

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

  assertStrictEquals(obj, hookedObj);
  assertEquals(await hookedObj.sayHi('David'), 'Hi Dave?');
  assertEquals(await hookedObj.addOne(1), 3);
});

it('hooking multiple times works properly', async () => {
  const obj = getObject();

  hooks(obj, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      },
    ]),
  });

  hooks(obj, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '!';
      },
    ]),
  });

  assertEquals(await obj.sayHi('David'), 'Hi David!?');
});

it('throws an error when hooking invalid method', async () => {
  const obj = getObject();

  assertThrows(
    () =>
      hooks(obj, {
        test: middleware([
          async (_ctx, next) => {
            await next();
          },
        ]),
      }),
    undefined,
    `Can not apply hooks. 'test' is not a function`,
  );
});

it('works with object level hooks', async () => {
  const obj = getObject();

  hooks(obj, [
    async (ctx: HookContext, next: NextFunction) => {
      await next();

      ctx.result += '!';
    },
  ]);

  hooks(obj, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        await next();

        ctx.result += '?';
      },
    ]),
  });

  assertEquals(await obj.sayHi('Dave'), 'Hi Dave?!');
});
