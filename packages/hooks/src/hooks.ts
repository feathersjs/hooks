import { compose, Middleware } from './compose';
import {
  HookContext, setManager, HookContextData, HookOptions, convertOptions, setMiddleware
} from './base';
import { copyFnProperties, copyProperties } from './utils';

export function getOriginal (fn: any): any {
  return typeof fn.original === 'function' ? getOriginal(fn.original) : fn;
}

export function functionHooks <F> (fn: F, managerOrMiddleware: HookOptions) {
  if (typeof fn !== 'function') {
    throw new Error('Can not apply hooks to non-function');
  }

  const manager = convertOptions(managerOrMiddleware);
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
      (ctx, next) => next().then(() => returnContext ? ctx : ctx.result)
    ];

    // Create the hook chain by calling the `collectMiddleware function
    const mw = manager.collectMiddleware(this, args);

    if (mw) {
      Array.prototype.push.apply(hookChain, mw);
    }

    // Runs the actual original method if `ctx.result` is not already set
    hookChain.push((ctx, next) => {
      if (!Object.prototype.hasOwnProperty.call(context, 'result')) {
        return Promise.resolve(original.apply(this, ctx.arguments)).then(result => {
          ctx.result = result;

          return next();
        });
      }

      return next();
    });

    return compose(hookChain).call(this, context);
  };

  copyFnProperties(wrapper, fn);
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

export type HookMap<O = any> = {
  [L in keyof O]?: HookOptions;
}

export function objectHooks (_obj: any, hooks: HookMap|Middleware[]) {
  const obj = typeof _obj === 'function' ? _obj.prototype : _obj;

  if (Array.isArray(hooks)) {
    return setMiddleware(obj, hooks);
  }

  return Object.keys(hooks).reduce((result, method) => {
    const fn = obj[method];

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const manager = convertOptions(hooks[method]);

    result[method] = functionHooks(fn, manager.props({ method }));

    return result;
  }, obj);
};

export const hookDecorator = (managerOrMiddleware?: HookOptions) => {
  const wrapper: any = (_target: any, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
    const manager = convertOptions(managerOrMiddleware);

    if (!descriptor) {
      setManager(_target.prototype, manager);

      return _target;
    }

    const fn = descriptor.value;

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    descriptor.value = functionHooks(fn, manager.props({ method }));

    return descriptor;
  };

  return wrapper;
};
