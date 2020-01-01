import { functionHooks, ContextCreator } from './function';
import { objectHooks, MiddlewareMap, ContextCreatorMap } from './object';
import { Middleware } from './compose';

export * from './function';
export * from './compose';
export * from './object';

export function hooks<F, T = any> (method: F, _hooks: Array<Middleware<T>>, defaultContext?: ContextCreator<T>): F;
export function hooks<O> (obj: O, hookMap: MiddlewareMap, contextMap?: ContextCreatorMap): O;
export function hooks (...args: any[]) {
  const [ target, _hooks, ...rest ] = args;

  if (Array.isArray(_hooks)) {
    return functionHooks(target, _hooks, ...rest);
  }

  return objectHooks(target, _hooks, ...rest);
}
