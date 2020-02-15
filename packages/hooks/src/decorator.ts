import { functionHooks } from './function';
import {
  HookContext,
  registerMiddleware,
  normalizeOptions,
  HookSettings, withParams
} from './base';

export const hookDecorator = <T> (hooks: HookSettings<T> = []) => {
  const wrapper: any = (_target: any, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
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

  function params (...args: Array<string | [string, any]>): typeof wrapper {
    const { context, ...options } = normalizeOptions(hooks);
    return {
      ...options,
      context: [...context, withParams(...args)]
    };
  }

  return Object.assign(wrapper, { params });
};
