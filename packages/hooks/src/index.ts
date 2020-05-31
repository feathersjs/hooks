import { functionHooks } from './function';
import { Middleware } from './compose';
import { objectHooks, HookMap } from './object';
import { hookDecorator } from './decorator';
import { HookManager, HookContextData, HookContext, HookContextConstructor, HookOptions } from './base';

export * as context from './context';
export * from './function';
export * from './compose';
export * from './base';

export interface WrapperAddon<F> {
  original: F;
  Context: HookContextConstructor;
  createContext: (data?: HookContextData) => HookContext;
}

export type WrappedFunction<F, T> = F&((...rest: any[]) => Promise<T>|Promise<HookContext>)&WrapperAddon<F>;

/**
 * Initializes a hook settings object with the given middleware.
 * @param mw The list of middleware
 */
export function middleware (mw: Middleware[] = []) {
  const manager = new HookManager();

  return manager.middleware(mw);
}

/**
 * Returns a new function that wraps an existing async function
 * with hooks.
 *
 * @param fn The async function to add hooks to.
 * @param manager An array of middleware or hook settings
 * (`middleware([]).params()` etc.)
 */
export function hooks<F, T = any> (
  fn: F, manager: HookManager
): WrappedFunction<F, T>;

/**
 * Add hooks to one or more methods on an object or class.
 * @param obj The object to add hooks to
 * @param hookMap A map of middleware settings where the
 * key is the method name.
 */
export function hooks<O> (obj: O|(new (...args: any[]) => O), hookMap: HookMap<O>|Middleware[]): O;

/**
 * Decorate a class method with hooks.
 * @param _manager The hooks settings
 */
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
