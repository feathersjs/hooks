import { functionHooks } from './function';
import { Middleware } from './compose';
import { ContextUpdater } from './base';
import { objectHooks, MiddlewareMap, ContextUpdaterMap } from './object';
import { hookDecorator } from './decorator';

export * from './function';
export * from './compose';
export * from './base';

export interface OriginalAddon<F> {
  original: F;
}

// hooks(fn, hooks, updateContext?)
export function hooks<F, T = any> (
  fn: F,
  hooks: Array<Middleware<T>>,
  updateContext?: ContextUpdater<T>
): F&((...rest: any[]) => Promise<T>)&OriginalAddon<F>;
// hooks(object, methodHookMap, methodUpdateContextMap?)
export function hooks<T> (obj: T, hookMap: MiddlewareMap, contextMap?: ContextUpdaterMap): T;
// @hooks(hooks)
export function hooks<F, T = any> (
  hooks: Array<Middleware<T>>,
  updateContext?: ContextUpdater<T>
): any;
// Fallthrough to actual implementation
export function hooks (...args: any[]) {
  const [ target, _hooks, ...rest ] = args;

  if (Array.isArray(_hooks) && typeof target === 'function') {
    return functionHooks(target, _hooks, ...rest);
  }

  if (Array.isArray(target)) {
    return hookDecorator(target, _hooks);
  }

  return objectHooks(target, _hooks, ...rest);
}
