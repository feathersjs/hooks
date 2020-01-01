import { Middleware } from './compose';
import { ContextCreator, functionHooks, initContext } from './function';

export interface MiddlewareMap {
  [key: string]: Middleware[];
}

export interface ContextCreatorMap {
  [key: string]: ContextCreator;
}

export const objectHooks = (_obj: any, hookMap: MiddlewareMap, contextMap?: ContextCreatorMap) => {
  const obj = typeof _obj === 'function' ? _obj.prototype : _obj;

  return Object.keys(hookMap).reduce((result, method) => {
    const value = obj[method];
    const hooks = hookMap[method];
    const createContext = (contextMap && contextMap[method]) || initContext();
    const methodContext = (...args: any[]) => {
      const ctx = createContext(...args);

      ctx.method = method;

      return ctx;
    };

    if (typeof value !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const fn = functionHooks(value, hooks, methodContext);

    result[method] = fn;

    return result;
  }, obj);
};
