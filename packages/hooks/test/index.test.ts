// import { strict as assert } from 'assert';
// import { hooks, ORIGINAL, HOOKS, RETURN } from '../src';
// import { NextFunction } from '../src/compose';

describe('async-hooks', () => {
  // describe('hookDecorator', () => {
  //   const obj = {
  //     test: 'me',

  //     async sayHi (name) {
  //       return `Hi ${name}`;
  //     }
  //   };

  //   it('runs as a decorator', async () => {
  //     const decorator = hooks([async (ctx, next) => {
  //       assert.deepStrictEqual(ctx, {
  //         method: 'sayHi',
  //         arguments: [ 'David' ]
  //       });

  //       await next();

  //       ctx.result += ' Decorated';
  //     }]);

  //     assert.strictEqual(decorator.length, 3);

  //     const descriptor = Object.getOwnPropertyDescriptor(obj, 'sayHi');
  //     const modifiedDescriptor = decorator(obj, 'sayHi', descriptor);

  //     Object.defineProperty(obj, 'sayHi', modifiedDescriptor);

  //     assert.strictEqual(await obj.sayHi('David'), 'Hi David Decorated');
  //   });

  //   it('throws an error when decorating a non-function', async () => {
  //     const decorator = hooks([async (ctx, next) => {
  //       await next();
  //     }]);

  //     assert.strictEqual(decorator.length, 3);

  //     try {
  //       const descriptor = Object.getOwnPropertyDescriptor(obj, 'test');
  //       decorator(obj, 'test', descriptor);
  //       assert.fail('Should never get here');
  //     } catch (error) {
  //       assert.strictEqual(error.message, `Can not apply hooks. 'test' is not a function`);
  //     }
  //   });
  // });
});
