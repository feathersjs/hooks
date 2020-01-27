import { compose, Middleware } from './compose';
import {
  HookContext,
  registerMiddleware,
  normalizeOptions,
  HookSettings,
  HOOK_ERROR
} from './base';

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
  const wrapper = function (this: any, ...args: any[]) {
    // If we got passed an existing HookContext instance, we want to return it as well
    const returnContext = args[args.length - 1] instanceof HookContext;
    // Initialize the context. Either the default context or the one that was passed
    const baseContext: HookContext = returnContext ? args.pop() : new HookContext();
    // Initialize the context with the self reference and arguments
    const context = updateContext(this, args, baseContext);
    // Assemble the hook chain
    const hookChain: Middleware[] = [
      // Return `ctx.result` or the context
      (ctx, next) => next()
        .then(
          () => returnContext ? ctx : ctx.result,
          error => {
            if (!returnContext) {
              throw error;
            }
            ctx[HOOK_ERROR] = error;
            throw ctx;
          }
        ),
      // Create the hook chain by calling the `collectMiddleware function
      ...collect(this, wrapper, args),
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

  registerMiddleware(wrapper, middleware);

  return Object.assign(wrapper, { original });
};
