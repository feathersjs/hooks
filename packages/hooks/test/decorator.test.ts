// import { strict as assert } from 'assert';
// import { hooks, HookContext, withParams, NextFunction } from '../src';

// describe('hookDecorator', () => {
//   it('hook decorator on method and classes with inheritance', async () => {
//     const expectedName = 'David NameFromTopLevel NameFromDummyClass';

//     @hooks([async (ctx, next) => {
//       ctx.name += ' NameFromTopLevel';

//       await next();

//       ctx.result += ' ResultFromTopLevel';
//     }])
//     class TopLevel {}

//     @hooks([async (ctx, next) => {
//       ctx.name += ' NameFromDummyClass';

//       await next();

//       ctx.result += ' ResultFromDummyClass';
//     }])
//     class DummyClass extends TopLevel {
//       @hooks({
//         middleware: [async (ctx: HookContext, next: NextFunction) => {
//           assert.deepStrictEqual(ctx, new HookContext({
//             method: 'sayHi',
//             self: instance,
//             arguments: ['David NameFromTopLevel NameFromDummyClass'],
//             name: expectedName
//           }));

//           await next();

//           ctx.result += ' ResultFromMethodDecorator';
//         }],
//         context: withParams('name')
//       })
//       async sayHi (name: string) {
//         return `Hi ${name}`;
//       }

//       @hooks()
//       async hookedFn () {
//         return 'Hooks with nothing';
//       }

//       @hooks([async (_ctx: HookContext, next: NextFunction) => next()])
//       async sayWorld () {
//         return 'World';
//       }
//     }

//     const instance = new DummyClass();

//     assert.strictEqual(await instance.sayHi('David'),
//       `Hi ${expectedName} ResultFromMethodDecorator ResultFromDummyClass ResultFromTopLevel`
//     );
//   });

//   it('error cases', () => {
//     assert.throws(() => hooks([])({}, 'test', {
//       value: 'not a function'
//     }), {
//       message: `Can not apply hooks. 'test' is not a function`
//     });
//   });
// });
