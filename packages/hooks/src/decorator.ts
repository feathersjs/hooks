import { functionHooks } from './function';
import { HookContext, registerMiddleware, normalizeOptions, HookSettings } from './base';

export const hookDecorator = <T> (hooks: HookSettings<T> = []) => {
  return (_target: any, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
    const { context, ...options } = normalizeOptions(hooks);

    if (!descriptor) {
      registerMiddleware(_target.prototype, options.middleware);

      return _target;
    }

    const fn = descriptor.value;

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    context.push((_self: any, _fn: any, _args: any[], ctx: HookContext) => {
      ctx.method = method;
      return ctx;
    });

    descriptor.value = functionHooks(fn, {
      ...options,
      context
    });

    return descriptor;
  };
};
