import { compose, Middleware } from './compose';

// Typing hacks converting symbols as strings so they can be used as keys
export const HOOKS: string = Symbol('@feathersjs/hooks') as any;
export const ORIGINAL: string = Symbol('@feathersjs/hooks/original') as any;
export const CONTEXT: string = Symbol('@feathersjs/hooks/context') as any;

export class HookContext<T = any> {
  result?: T;
  arguments: any[];
  [key: string]: any;

  toJSON () {
    return Object.keys(this).reduce((result, key) => {
      return {
        ...result,
        [key]: this[key]
      };
    }, {} as { [key: string]: any });
  }
}

export type ContextCreator<T = any> = (...args: any[]) => HookContext<T>;

export const initContext = <T = any>(...params: string[]): ContextCreator<T> => () => {
  const ctx = new HookContext<T>();

  if (params.length > 0) {
    Object.defineProperty(ctx, 'arguments', {
      get (this: HookContext<T>) {
        const result = params.map(name => this[name]);

        return typeof Object.freeze === 'function' ? Object.freeze(result) : result;
      },

      set (this: HookContext<T>, value: any[]) {
        params.forEach((name, index) => {
          this[name] = value[index];
        });
      }
    });
  }

  return ctx;
};

export const createContext = <T = any>(fn: any, data: { [key: string]: any } = {}): HookContext<T> => {
  const getContext: ContextCreator<T> = fn[CONTEXT];

  if (typeof getContext !== 'function') {
    throw new Error('Can not get context, function is not hook enabled');
  }

  const context = getContext();

  return Object.assign(context, data);
};

export const functionHooks = <T = any>(method: any, _hooks: Array<Middleware<T>>, defaultContext: ContextCreator<T> = initContext()) => {
  if (typeof method !== 'function') {
    throw new Error('Can not apply hooks to non-function');
  }

  const hooks = (method[HOOKS] || []).concat(_hooks);
  const original = method[ORIGINAL] || method;
  const fn = function (this: any, ...args: any[]) {
    const returnContext = args[args.length - 1] instanceof HookContext;
    const context: HookContext = returnContext ? args.pop() : defaultContext.call(this, args);
    const hookChain: Middleware[] = [
      // Return `ctx.result` or the context
      (ctx, next) => next().then(() => returnContext ? ctx : ctx.result),
      // The hook chain attached to this function
      ...(fn as any)[HOOKS],
      // Runs the actual original method if `ctx.result` is not set
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

    context.arguments = args;

    return compose(hookChain).call(this, context);
  };

  Object.assign(fn, {
    [CONTEXT]: defaultContext,
    [HOOKS]: hooks,
    [ORIGINAL]: original
  });

  return fn;
};
