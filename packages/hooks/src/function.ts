import { compose, Middleware } from './compose';
import {
  HookContext,
  registerMiddleware,
  registerContextUpdater,
  normalizeOptions,
  collectContextUpdaters,
  HookSettings
} from './base';

function getOriginal (fn: any) : Function {
  return fn.original ? getOriginal(fn.original) : fn;
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
export const functionHooks = <F, T = any>(original: F, opts: HookSettings<T>) => {
  if (typeof original !== 'function') {
    throw new Error('Can not apply hooks to non-function');
  }

  const { context: updateContext, collect, middleware } = normalizeOptions(opts);

  const wrapper : any = function (this: any, ...args: any[]) {
    // If we got passed an existing HookContext instance, we want to return it as well
    const returnContext = args[args.length - 1] instanceof HookContext;
    // Initialize the context. Either the default context or the one that was passed
    let context: HookContext = returnContext ? args.pop() : new HookContext();

    const contextUpdaters = collectContextUpdaters(this, wrapper, args);
    // Initialize the context with the self reference and arguments

    for (const contextUpdater of contextUpdaters) {
      context = contextUpdater(this, wrapper, args, context);
    }

    // Assemble the hook chain
    const hookChain: Middleware[] = [
      // Return `ctx.result` or the context
      (ctx, next) => next().then(() => returnContext ? ctx : ctx.result),
      // Create the hook chain by calling the `collectMiddleware function
      ...collect(this, wrapper, args),
      // Runs the actual original method if `ctx.result` is not already set
      (ctx, next) => {
        if (ctx.result === undefined) {
          return Promise.resolve(getOriginal(original).apply(this, ctx.arguments)).then(result => {
            ctx.result = result;

            return next();
          });
        }

        return next();
      }
    ];

    return compose(hookChain).call(this, context);
  };

  registerContextUpdater(wrapper, updateContext);
  registerMiddleware(wrapper, middleware);

  return Object.assign(wrapper, { original });
};
