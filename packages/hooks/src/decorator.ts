import { functionHooks } from './function';
import { HookContext, registerMiddleware, normalizeOptions, HookSettings } from './base';

export const hookDecorator = <T> (hooks: HookSettings<T> = []) => {
  return (_target: any, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
    const options = normalizeOptions(hooks);

    if (!descriptor) {
      registerMiddleware(_target.prototype, options.middleware);

      return _target;
    }

    const fn = descriptor.value;

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const originalContext = options.context;
    const context = (self: any, args: any[], context: HookContext<any>) => {
      const ctx = originalContext(self, args, context);

      ctx.method = method;

      return ctx;
    };

    descriptor.value = functionHooks(fn, {
      ...options,
      context
    });

    return descriptor;
  };
};
