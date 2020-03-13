import { Middleware } from './compose';

export const HOOKS: string = Symbol('@feathersjs/hooks') as any;
export const CONTEXT: string = Symbol('@feathersjs/hooks/context') as any;

export function getMiddleware<T> (target: any): Middleware<T>[] {
  return (target && target[HOOKS]) || [];
}

export type MiddlewareSetter = (currentMiddleware: Middleware[]) => Middleware[];

/**
 * @param target The target object or function
 * @param middleware or function
 */
export function setMiddleware<T> (target: T, middleware: Middleware[] | MiddlewareSetter) {
  (target as any)[HOOKS] = typeof middleware === 'function' ? middleware(getMiddleware(target)) : middleware;

  return target;
}

/**
 * @param target The target object
 * @param middleware or a function that takes current middleware as first argument
 */
export function registerMiddleware<T> (target: T, middleware: Middleware[]) {
  return setMiddleware(target, (current: Middleware[]) => current.concat(middleware));
}

export function getContextUpdater<T> (target: any): ContextUpdater<T>[] {
  return (target && target[CONTEXT]) || [];
}

/**
 * @param target The target object or function
 * @param updaters
 */
export function registerContextUpdater<T> (target: T, updaters: ContextUpdater[]) {
  const current = getContextUpdater(target);

  (target as any)[CONTEXT] = current.concat(updaters);

  return target;
}

/**
 * The base hook context.
 */
export class HookContext<T = any, C = any> {
  result?: T;
  method?: string;
  self: C;
  arguments: any[];
  [key: string]: any;

  constructor (data: { [key: string]: any } = {}) {
    Object.assign(this, data);
  }
}

/**
 * A function that updates the hook context with the `this` reference and
 * arguments of the function call.
 */
export type ContextUpdater<T = any> = (self: any, fn: any, args: any[], context: HookContext<T>) => HookContext<T>;
/**
 * A function that for a given function, calling context and arguments returns the list of hooks
 */
export type MiddlewareCollector<T = any> = (self: any, fn: any, args: any[]) => Middleware<T>[];

/**
 * Available options when initializing hooks with more than just an array of middleware
 */
export interface FunctionHookOptions<T = any> {
  middleware: Middleware<T>[];
  context: ContextUpdater<T>[];
  collect: MiddlewareCollector<T>;
}

export type HookSettings<T = any> = Middleware<T>[]|Partial<Omit<FunctionHookOptions, 'context'> & {
  context: ContextUpdater<T>|ContextUpdater<T>[];
}>;

export function defaultCollectMiddleware<T = any> (self: any, fn: any, args: any[]): Middleware[] {
  return [
    ...getMiddleware<T>(self),
    ...(fn && typeof fn.collect === 'function' ? fn.collect(fn, fn.original, args) : getMiddleware(fn))
  ];
}

export function normalizeOptions<T = any> (opts: any): FunctionHookOptions<T> {
  const options: Partial<FunctionHookOptions> = Array.isArray(opts) ? { middleware: opts } : opts;
  const {
    middleware = [],
    context = withParams(),
    collect = defaultCollectMiddleware
  } = options;

  const contextUpdaters = Array.isArray(context) ? context : [context];

  return { middleware, context: contextUpdaters, collect };
}

export function collectContextUpdaters<T = any> (self: any, fn: any, args: any[]): ContextUpdater[] {
  return [
    ...getContextUpdater<T>(self),
    ...(fn.original ? collectContextUpdaters(fn, fn.original, args) : getContextUpdater(fn))
  ];
}

/**
 * Returns a ContextUpdater function that turns function arguments like
 * `function (data, name)` into named properties (`context.data`, `context.name`)
 * on the hook context
 *
 * @param params The list of parameter names
 */
export function withParams<T = any> (...params: (string | [string, any])[]) {
  return (self: any, _fn: any, args: any[], context: HookContext<T>) => {
    const result = params.map((param: string | [string, any], index: number) => {
      if (typeof param === 'string') {
        context[param] = args[index];
        return args[index];
      }

      const [name, defaultValue] = param;
      const value = !(index in args) ? defaultValue : args[index];

      context[name] = value;

      return value;
    }, []);

    if (params.length > 0) {
      Object.defineProperty(context, 'arguments', {
        enumerable: true,
        value: new Proxy(result, {
          get(target: any, prop: any): any {
            const param: any = params[prop];

            if (params.indexOf(param) !== -1) {
              const name = typeof param === 'string' ? param : param[0];

              return context[name];
            }

            return target[prop];
          },
          set(target: any, prop: any, value: any): boolean {
            target[prop] = value;

            if (prop in params) {
              const param = params[prop];
              const name = typeof param === 'string' ? param : param[0];

              context[name] = value;
            }

            return true;
          }
        })
      });
    } else if (!context.arguments) {
      context.arguments = args;
    }

    Object.seal(context.arguments);

    if (self) {
      context.self = self;
    }

    return context;
  };
}

/**
 * Returns a ContextUpdater function that adds props on the hook context
 *
 * @param props The props object to assign
 */
export function withProps<T = any> (props: any) {
  return (_self: any, _fn: any, _args: any[], context: HookContext<T>) => {
    Object.assign(context, props);

    return context;
  };
}
