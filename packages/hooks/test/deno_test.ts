import { assertEquals } from 'https://deno.land/std@0.91.0/testing/asserts.ts';

import { hooks, HookContext, NextFunction, middleware } from '../deno/index.ts';

const hello = async (name?: string, _params: any = {}) => {
  return `Hello ${name}`;
};

class DummyClass {
  async sayHi (name: string) {
    return `Hi ${name}`;
  }

  async addOne (number: number) {
    return number + 1;
  }
}

Deno.test('can override context.result after', async () => {
  const updateResult = async (ctx: HookContext, next: NextFunction) => {
    await next();

    ctx.result += ' You!';
  };

  const fn = hooks(hello, [ updateResult ]);
  const res = await fn('There');

  assertEquals(res, 'Hello There You!');
});

Deno.test('hooking object on class adds to the prototype', async () => {
  hooks(DummyClass, {
    sayHi: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        assertEquals(ctx, new (DummyClass.prototype.sayHi as any).Context({
          arguments: ['David'],
          method: 'sayHi',
          name: 'David',
          self: instance
        }));

        await next();

        ctx.result += '?';
      }
    ]).params('name'),

    addOne: middleware([
      async (ctx: HookContext, next: NextFunction) => {
        ctx.arguments[0] += 1;

        await next();
      }
    ])
  });

  const instance = new DummyClass();

  assertEquals(await instance.sayHi('David'), 'Hi David?');
  assertEquals(await instance.addOne(1), 3);
});
