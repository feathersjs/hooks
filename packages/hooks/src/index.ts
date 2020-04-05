import { functionHooks } from './function';
import { Middleware } from './compose';
import { objectHooks, HookMap } from './object';
import { hookDecorator } from './decorator';
import { HookManager, HookContextData, HookContext, HookContextConstructor, HookOptions } from './base';

export * from './function';
export * from './compose';
export * from './base';

export interface WrapperAddon<F> {
  original: F;
  Context: HookContextConstructor;
  createContext: (data?: HookContextData) => HookContext;
}

export type WrappedFunction<F, T> = F&((...rest: any[]) => Promise<T>|Promise<HookContext>)&WrapperAddon<F>;

export function middleware (mw: Middleware[]) {
  const manager = new HookManager();

  return manager.middleware(mw);
}

// hooks(fn, hookOptions)
export function hooks<F, T = any> (
  fn: F, manager: HookManager
): WrappedFunction<F, T>;
// hooks(object, hookMap)
export function hooks<O> (obj: O, hookMap: HookMap|Middleware[]): O;
// @hooks(hookOptions)
export function hooks<T = any> (
  _manager?: HookOptions
): any;
// Fallthrough to actual implementation
export function hooks (...args: any[]) {
  const [ target, _hooks ] = args;

  if (typeof target === 'function' && (_hooks instanceof HookManager || Array.isArray(_hooks))) {
    return functionHooks(target, _hooks);
  }

  if (args.length === 2) {
    return objectHooks(target, _hooks);
  }

  return hookDecorator(target);
}
