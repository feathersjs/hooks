import { Middleware } from './compose';
import { functionHooks } from './function';
import { ContextUpdater, HookContext, withParams, registerMiddleware } from './base';

export interface MiddlewareMap {
  [key: string]: Middleware[];
}

export interface ContextUpdaterMap {
  [key: string]: ContextUpdater;
}

export const objectHooks = (_obj: any, hooks: MiddlewareMap|Middleware[], contextMap?: ContextUpdaterMap) => {
  const obj = typeof _obj === 'function' ? _obj.prototype : _obj;

  if (Array.isArray(hooks)) {
    return registerMiddleware(obj, hooks);
  }

  const hookMap = hooks as MiddlewareMap;

  return Object.keys(hookMap).reduce((result, method) => {
    const value = obj[method];
    const hooks = hookMap[method];
    const originalUpdateContext = (contextMap && contextMap[method]) || withParams();
    const updateContext = (self: any, args: any[], context: HookContext<any>) => {
      const ctx = originalUpdateContext(self, args, context);

      ctx.method = method;

      return ctx;
    };

    if (typeof value !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const fn = functionHooks(value, hooks, updateContext);

    result[method] = fn;

    return result;
  }, obj);
};
