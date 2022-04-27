import { assertEquals, assertThrows, it } from './dependencies.ts';
import { HookContext, hooks, middleware, NextFunction } from '../src/index.ts';

it('hook decorator on method and classes with inheritance', async () => {
  const expectedName = 'David NameFromTopLevel NameFromDummyClass';

  @hooks([
    async (ctx, next) => {
      ctx.arguments[0] += ' NameFromTopLevel';

      await next();

      ctx.result += ' ResultFromTopLevel';
    },
  ])
  class TopLevel {}

  @hooks([async (ctx, next) => {
    ctx.arguments[0] += ' NameFromDummyClass';

    await next();

    ctx.result += ' ResultFromDummyClass';
  }])
  class DummyClass extends TopLevel {
    @hooks(
      middleware([
        async (ctx: HookContext, next: NextFunction) => {
          assertEquals(ctx.method, 'sayHi');
          assertEquals(ctx.arguments, [expectedName]);
          assertEquals(ctx.name, expectedName);

          await next();

          ctx.result += ' ResultFromMethodDecorator';
        },
      ]).params('name'),
    )
    async sayHi(name: string) {
      return `Hi ${name}`;
    }

    @hooks()
    async hookedFn() {
      return 'Hooks with nothing';
    }

    @hooks([async (_ctx: HookContext, next: NextFunction) => next()])
    async sayWorld() {
      return 'World';
    }
  }

  const instance = new DummyClass();

  assertEquals(
    await instance.sayHi('David'),
    `Hi ${expectedName} ResultFromMethodDecorator ResultFromDummyClass ResultFromTopLevel`,
  );
});

it('error cases', () => {
  assertThrows(
    () => hooks([])({}, 'test', { value: 'not a function' }),
    undefined,
    `Can not apply hooks. 'test' is not a function`,
  );
});
