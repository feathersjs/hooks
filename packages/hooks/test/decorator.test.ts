import { strict as assert } from 'assert';
import { hookDecorator } from '../src/decorator';
import { HookContext } from '../src/function';
import { NextFunction } from '../src/compose';

describe('objectHooks', () => {
  it('hooking object on class adds to the prototype', async () => {
    const verify = async (ctx: HookContext, next: NextFunction) => {
      assert.deepStrictEqual(ctx.toJSON(), {
        method: 'sayHi',
        arguments: [ 'David' ]
      });

      await next();

      ctx.result += '?';
    };

    class DummyClass {
      @hookDecorator([ verify ])
      async sayHi (name: string) {
        return `Hi ${name}`;
      }
    }

    const instance = new DummyClass();

    assert.strictEqual(await instance.sayHi('David'), 'Hi David?');
  });
});
