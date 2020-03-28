import { compose, Middleware } from './compose';
import {
  HookContext, HookManager, setManager, HookContextData, copyProperties
} from './base';

function getOriginal (fn: any): any {
  return typeof fn.original === 'function' ? getOriginal(fn.original) : fn;
}

/**
 * Returns a new function that is wrapped in the given hooks.
 * Allows to pass a context updater function, usually used
 * with `withParams` to initialize named parameters. If not passed
 * just set `context.arguments` to the function call arguments
 * and `context.self` to the function call `this` reference.
 *
 * @param original The function to wrap
 * @param opts A list of hooks (middleware) or options for more detailed hook processing
 */
export function functionHooks <F> (fn: F, managerOrMiddleware: HookManager|Middleware[]) {
  if (typeof fn !== 'function') {
    throw new Error('Can not apply hooks to non-function');
  }

  const manager: HookManager = Array.isArray(managerOrMiddleware)
      ? new HookManager().middleware(managerOrMiddleware)
      : managerOrMiddleware;

  const wrapper: any = function (this: any, ...args: any[]) {
    const { Context, original } = wrapper;
    // If we got passed an existing HookContext instance, we want to return it as well
    const returnContext = args[args.length - 1] instanceof Context;
    // Use existing context or default
    const base = returnContext ? (args.pop() as HookContext) : new Context();
    // Initialize the context
    const context = manager.initializeContext(this, args, base);
    // Assemble the hook chain
    const hookChain: Middleware[] = [
      // Return `ctx.result` or the context
      (ctx, next) => next().then(() => returnContext ? ctx : ctx.result),
      // Create the hook chain by calling the `collectMiddleware function
      ...manager.collectMiddleware(this, args),
      // Runs the actual original method if `ctx.result` is not already set
      (ctx, next) => {
        if (ctx.result === undefined) {
          return Promise.resolve(original.apply(this, ctx.arguments)).then(result => {
            ctx.result = result;

            return next();
          });
        }

        return next();
      }
    ];

    return compose(hookChain).call(this, context);
  };

  copyProperties(wrapper, fn);
  setManager(wrapper, manager);

  return Object.assign(wrapper, {
    original: getOriginal(fn),
    Context: manager.getContextClass(),
    createContext: (data: HookContextData = {}) => {
      return new wrapper.Context(data);
    }
  });
};
