import { Middleware } from './compose';
import { functionHooks } from './function';
import { HookContext, registerMiddleware, normalizeOptions, HookSettings } from './base';

export interface HookMap {
  [key: string]: HookSettings;
}

export const objectHooks = (_obj: any, hooks: HookMap|Middleware[]) => {
  const obj = typeof _obj === 'function' ? _obj.prototype : _obj;

  if (Array.isArray(hooks)) {
    return registerMiddleware(obj, hooks);
  }

  return Object.keys(hooks).reduce((result, method) => {
    const value = obj[method];
    const { context, ...options } = normalizeOptions(hooks[method]);

    if (typeof value !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    context.push((_self: any, _fn: any, _args: any[], ctx: HookContext) => {
      ctx.method = method;
      return ctx;
    });

    result[method] = functionHooks(value, {
      ...options,
      context
    });

    return result;
  }, obj);
};
