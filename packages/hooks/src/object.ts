import { Middleware } from './compose';
import { functionHooks } from './function';
import { setMiddleware, convertOptions, HookOptions } from './base';
import { contextProperties } from './hooks';

export type HookMap<O = any> = {
  [L in keyof O]?: HookOptions;
}

export function objectHooks (_obj: any, hooks: HookMap|Middleware[]) {
  const obj = typeof _obj === 'function' ? _obj.prototype : _obj;

  if (Array.isArray(hooks)) {
    return setMiddleware(obj, hooks);
  }

  return Object.keys(hooks).reduce((result, method) => {
    const fn = obj[method];

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const manager = convertOptions(hooks[method]);

    manager._middleware.unshift(contextProperties({ method }));

    result[method] = functionHooks(fn, manager);

    return result;
  }, obj);
};
