import { Middleware } from './compose';

export const HOOKS: string = Symbol('@feathersjs/hooks') as any;

/**
 *
 * @param target The target object or function
 * @param middleware
 */
export function registerMiddleware<T> (target: T, middleware: Middleware[]) {
  const current: Middleware[] = (target as any)[HOOKS] || [];

  (target as any)[HOOKS] = current.concat(middleware);

  return target;
}

export function getMiddleware (target: any): Middleware[] {
  return (target && target[HOOKS]) || [];
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
export type ContextUpdater<T = any> = (self: any, args: any[], context: HookContext<T>) => HookContext<T>;

/**
 * Returns a ContextUpdater function that turns function arguments like
 * `function (data, name)` into named properties (`context.data`, `context.name`)
 * on the hook context
 *
 * @param params The list of parameter names
 */
export function withParams<T = any> (...params: string[]) {
  return (self: any, args: any[], context: HookContext<T>) => {
    params.forEach((name, index) => {
      context[name] = args[index];
    });

    if (params.length > 0) {
      Object.defineProperty(context, 'arguments', {
        get (this: HookContext<T>) {
          const result = params.map(name => this[name]);

          return Object.freeze(result);
        }
      });
    } else {
      context.arguments = args;
    }

    if (self) {
      context.self = self;
    }

    return context;
  };
}
