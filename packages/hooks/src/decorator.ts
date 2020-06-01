import { functionHooks } from './function';
import { setManager, HookOptions, convertOptions } from './base';
import { properties } from './context';

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

    manager._middleware.unshift(properties({ method }));
    descriptor.value = functionHooks(fn, manager);

    return descriptor;
  };

  return wrapper;
};
