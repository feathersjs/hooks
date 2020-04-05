import { functionHooks } from './function';
import { setManager, HookOptions, convertOptions } from './base';

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

    descriptor.value = functionHooks(fn, manager.props({ method}));

    return descriptor;
  };

  return wrapper;
};
