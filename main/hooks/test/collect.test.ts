import { assertEquals, assertStrictEquals, assertThrowsAsync, it } from './dependencies.ts';
import { collect, HookContext, hooks, middleware, NextFunction } from '../src/index.ts';

it('collect: hooks run in order', async () => {
  class DummyClass {
    async create(data: any) {
      data.id = 1;
      return data;
    }
  }
  hooks(DummyClass, {
    create: middleware([
      collect({
        before: [
          (ctx: any) => {
            ctx.data.log.push('collect-1 : before : 1');
          },
          (ctx: any) => {
            ctx.data.log.push('collect-1 : before : 2');
          },
        ],
        after: [
          (ctx: any) => {
            ctx.data.log.push('collect-1 : after : 1');
          },
          (ctx: any) => {
            ctx.data.log.push('collect-1 : after : 2');
          },
        ],
        error: [],
      }),
      async (ctx: HookContext, next: NextFunction) => {
        ctx.data.log.push('async : before');
        await next();
        ctx.data.log.push('async : after');
      },
      collect({
        before: [
          (ctx: any) => {
            ctx.data.log.push('collect-2 : before : 3');
          },
          (ctx: any) => {
            ctx.data.log.push('collect-2 : before : 4');
          },
        ],
        after: [
          (ctx: any) => {
            ctx.data.log.push('collect-2 : after : 3');
          },
          (ctx: any) => {
            ctx.data.log.push('collect-2 : after : 4');
          },
        ],
        error: [],
      }),
    ]).params('data'),
  });

  const service = new DummyClass();
  const value = await service.create({ name: 'David', log: [] });

  assertEquals(value.log, [
    'collect-1 : before : 1',
    'collect-1 : before : 2',
    'async : before',
    'collect-2 : before : 3',
    'collect-2 : before : 4',
    'collect-2 : after : 3',
    'collect-2 : after : 4',
    'async : after',
    'collect-1 : after : 1',
    'collect-1 : after : 2',
  ]);
});

it('collect: error hooks', async () => {
  class DummyClass {
    async create(name: string) {
      if (name !== 'after') {
        throw new Error(`Error in method with ${name}`);
      }
    }
  }

  const collection = collect({
    before: [
      (ctx) => {
        if (ctx.arguments[0] === 'before') {
          throw new Error('in before hook');
        }
      },
    ],
    after: [
      (ctx) => {
        if (ctx.arguments[0] === 'after') {
          throw new Error('in after hook');
        }
      },
    ],
    error: [
      (ctx) => {
        if (ctx.arguments[0] === 'error') {
          throw new Error('in error hook');
        }

        if (ctx.arguments[0] === 'result') {
          ctx.result = 'result from error hook';
        }
      },
      (ctx) => {
        if (ctx.result === 'result from error hook') {
          ctx.result += '!';
        }
      },
    ],
  });

  hooks(DummyClass, {
    create: middleware([collection]).params('data'),
  });

  const service = new DummyClass();

  await assertThrowsAsync(
    () => service.create('test'),
    undefined,
    'Error in method with test',
  );

  await assertThrowsAsync(
    () => service.create('before'),
    undefined,
    'in before hook',
  );

  await assertThrowsAsync(
    () => service.create('after'),
    undefined,
    'in after hook',
  );

  await assertThrowsAsync(
    () => service.create('error'),
    undefined,
    'in error hook',
  );

  assertStrictEquals(await service.create('result'), 'result from error hook!');
});
