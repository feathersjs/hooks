import { functionHooks } from './function';
import { HookSettings } from './base';
import { objectHooks, HookMap } from './object';
import { hookDecorator } from './decorator';

export * from './function';
export * from './compose';
export * from './base';

export interface OriginalAddon<F> {
  original: F;
}

// hooks(fn, hookSettings)
export function hooks<F, T = any> (
  fn: F, hooks: HookSettings
): F&((...rest: any[]) => Promise<T>)&OriginalAddon<F>;
// hooks(object, hookMap)
export function hooks<O> (obj: O, hookMap: HookMap): O;
// @hooks(hookSettings)
export function hooks<T = any> (
  hooks?: HookSettings
): any;
// Fallthrough to actual implementation
export function hooks (...args: any[]) {
  const [ target, _hooks ] = args;

  if (typeof target === 'function' && Array.isArray(_hooks.middleware || _hooks)) {
    return functionHooks(target, _hooks);
  }

  if (args.length === 2) {
    return objectHooks(target, _hooks);
  }

  return hookDecorator(target);
}
