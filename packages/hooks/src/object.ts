import { Middleware } from './compose';
import { functionHooks } from './function';
import { HookManager, setMiddleware } from './base';

export interface HookMap {
  [key: string]: HookManager;
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

    const manager = hooks[method];

    result[method] = functionHooks(fn, manager.props({ method }));

    return result;
  }, obj);
};
