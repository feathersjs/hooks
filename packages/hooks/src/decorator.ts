import { Middleware } from './compose';
import { functionHooks, ContextCreator, initContext } from './function';

export const hookDecorator = <T> (hooks: Array<Middleware<T>>, createContext: ContextCreator<T> = initContext()) => {
  return (_target: object, method: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
    const fn = descriptor.value;

    if (typeof fn !== 'function') {
      throw new Error(`Can not apply hooks. '${method}' is not a function`);
    }

    const methodContext = (...args: any[]) => {
      const ctx = createContext(...args);

      ctx.method = method;

      return ctx;
    };

    descriptor.value = functionHooks(fn, hooks, methodContext);

    return descriptor;
  };
};
