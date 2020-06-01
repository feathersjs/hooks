import { HookContext, HookContextData, HookDefaultsInitializer } from './base'
import { NextFunction } from './compose'

/**
 * Returns a hook that initializes named function parameters on the
 * hook context.
 *
 * @param names A list of parameter names
 */
export function params (...names: string[]) {
  const descriptors = names.reduce((result, name, index) => {
      result[name] = {
        enumerable: true,
        get (this: any) {
          return this.arguments[index];
        },

        set (this: any, value) {
          this.arguments[index] = value;
        }
      }

      return result;
  }, {} as PropertyDescriptorMap);

  return async function contextParams (context: HookContext, next: NextFunction) {
    Object.defineProperties(context, descriptors);
    await next();
  };
}

/**
 * Returns a hook that sets the given properties on the hook context.
 *
 * @param properties The properties to set.
 */
export function properties (properties: HookContextData) {
  return async function contextProperties (context: HookContext, next: NextFunction) {
    Object.assign(context, properties);
    await next();
  }
}

/**
 * Returns a hook that calls a `callback(context)` function that
 * returns default values which will be set on the context if they
 * are currently `undefined`.
 *
 * @param initializer The initialization callback.
 */
export function defaults (initializer: HookDefaultsInitializer) {
  return async function contextDefaults (context: HookContext, next: NextFunction) {
    const defaults = await initializer(context);

    for (const name of Object.keys(defaults))  {
      if (context[name] === undefined) {
        context[name] = defaults[name];
      }
    }

    await next();
  }
}
