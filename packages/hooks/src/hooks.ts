import { HookContext, HookContextData, HookDefaultsInitializer } from './base'
import { NextFunction } from './compose'

export function contextParams (...names: string[]) {
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

  return async function defineParams (context: HookContext, next: NextFunction) {
    Object.defineProperties(context, descriptors);
    await next();
  };
}

export function contextProperties (properties: HookContextData) {
  return async function setProps (context: HookContext, next: NextFunction) {
    Object.assign(context, properties);
    await next();
  }
}

export function contextDefaults (initializer: HookDefaultsInitializer) {
  return async function setDefaults (context: HookContext, next: NextFunction) {
    const defaults = await initializer(context);

    for (const name of Object.keys(defaults))  {
      if (context[name] === undefined) {
        context[name] = defaults[name];
      }
    }

    await next();
  }
}
