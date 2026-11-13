import { compose } from './compose.ts';
import { HookContext } from './base.ts';

export type RegularMiddleware<T extends HookContext = any> = (
  context: T,
) => Promise<any> | any;
export interface RegularHookMap {
  before?: RegularMiddleware[];
  after?: RegularMiddleware[];
  error?: RegularMiddleware[];
}

function isPromiseLike(value: any): value is PromiseLike<any> {
  return value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof value.then === 'function';
}

const runHookValue = (
  hook: RegularMiddleware,
  context: any,
  type?: string,
): void | Promise<void> => {
  const typeBefore = context.type;
  if (type) context.type = type;
  const finish = (res: any) => {
    if (type) context.type = typeBefore;
    if (res && res !== context) {
      Object.assign(context, res);
    }
  };
  const result = hook.call(context.self, context);

  return isPromiseLike(result) ? Promise.resolve(result).then(finish) : finish(result);
};

const runHooksValue = (
  hooks: RegularMiddleware[],
  context: any,
  type?: string,
): void | Promise<void> => {
  let index = 0;

  const run = (): void | Promise<void> => {
    while (index < hooks.length) {
      const result = runHookValue(hooks[index++], context, type);

      if (result) {
        return result.then(run);
      }
    }
  };

  return run();
};

export const runHook = (
  hook: RegularMiddleware,
  context: any,
  type?: string,
) => Promise.resolve(runHookValue(hook, context, type));

export const runHooks = (hooks: RegularMiddleware[]) => (context: any) =>
  Promise.resolve().then(() => hooks.length ? runHooksValue(hooks, context) : context);

export function fromBeforeHook(hook: RegularMiddleware) {
  return (context: any, next: any) => {
    const result = runHookValue(hook, context, 'before');

    return result ? result.then(next) : next();
  };
}

export function fromAfterHook(hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return next().then(() => runHookValue(hook, context, 'after'));
  };
}

export function fromErrorHook(hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return next().catch((error: any) => {
      if (context.error !== error || context.result !== undefined) {
        (context as any).original = { ...context };
        context.error = error;
        delete context.result;
      }

      return runHook(hook, context, 'error')
        .then(() => {
          if (context.result === undefined && context.error !== undefined) {
            throw context.error;
          }
        })
        .catch((error) => {
          context.error = error;
          throw context.error;
        });
    });
  };
}

export function collect({
  before = [],
  after = [],
  error = [],
}: RegularHookMap) {
  const beforeList = [...before];
  const afterList = [...after];
  const beforeHooks = before.length
    ? [(context: any, next: any) => {
      const result = runHooksValue(beforeList, context, 'before');

      return result ? result.then(next) : next();
    }]
    : [];
  const afterHooks = after.length
    ? [(context: any, next: any) => next().then(() => runHooksValue(afterList, context, 'after'))]
    : [];
  const errorHooks = error.length ? [fromErrorHook(runHooks(error))] : [];

  return compose([...errorHooks, ...beforeHooks, ...afterHooks]);
}
