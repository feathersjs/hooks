import { compose, Middleware } from './compose';
import {
  HookContext, ContextUpdater, withParams,
  registerMiddleware, getMiddleware
} from './base';

/**
 * Returns a new function that is wrapped in the given hooks.
 * Allows to pass a context updater function, usually used
 * with `withParams` to initialize named parameters. If not passed
 * just set `context.arguments` to the function call arguments
 * and `context.self` to the function call `this` reference.
 *
 * @param fn The function to wrap
 * @param hooks The list of hooks (middleware)
 * @param updateContext A ContextUpdate method
 */
export const functionHooks = <T = any>(
  fn: any,
  hooks: Array<Middleware<T>>,
  updateContext: ContextUpdater = withParams()
) => {
  if (typeof fn !== 'function') {
    throw new Error('Can not apply hooks to non-function');
  }

  const result = registerMiddleware(function (this: any, ...args: any[]) {
    // If we got passed an existing HookContext instance, we want to return it as well
    const returnContext = args[args.length - 1] instanceof HookContext;
    // Initialize the context. Either the default context or the one that was passed
    const baseContext: HookContext = returnContext ? args.pop() : new HookContext();
    // Initialize the context with the self reference and arguments
    const context = updateContext(this, args, baseContext);
    // Assemble the hook chain
    const hookChain: Middleware[] = [
      // Return `ctx.result` or the context
      (ctx, next) => next().then(() => returnContext ? ctx : ctx.result),
      // The hooks attached to the `this` object
      ...getMiddleware(this),
      // The hook chain attached to this function
      ...getMiddleware(result),
      // Runs the actual original method if `ctx.result` is not set
      (ctx, next) => {
        if (ctx.result === undefined) {
          return Promise.resolve(fn.apply(this, ctx.arguments)).then(result => {
            ctx.result = result;

            return next();
          });
        }

        return next();
      }
    ];

    return compose(hookChain).call(this, context);
  }, hooks);

  return Object.assign(result, { original: fn });
};
