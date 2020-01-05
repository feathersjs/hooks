import { Middleware } from './compose';
import { functionHooks } from './function';
import { ContextUpdater, withParams, HookContext, registerMiddleware } from './base';

export const hookDecorator = <T> (hooks: Array<Middleware<T>>, _updateContext?: ContextUpdater<T>) => {
  return (_target: any, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
    if (!descriptor) {
      if (_updateContext) {
        throw new Error('Context can not be updated at the class decorator level. Remove updateContext parameter.');
      }

      registerMiddleware(_target.prototype, hooks);

      return _target;
    }

    const fn = descriptor.value;

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const originalUpdateContext = _updateContext || withParams();
    const updateContext = (self: any, args: any[], context: HookContext<any>) => {
      const ctx = originalUpdateContext(self, args, context);

      ctx.method = method;

      return ctx;
    };

    descriptor.value = functionHooks(fn, hooks, updateContext);

    return descriptor;
  };
};
