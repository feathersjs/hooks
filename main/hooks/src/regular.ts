import { compose } from './compose.ts';
import { HookContext } from './base.ts';

export type RegularMiddleware<T extends HookContext = any> = (context: T) => Promise<any> | any;

export interface RegularHookMap {
  before?: RegularMiddleware[],
  after?: RegularMiddleware[],
  error?: RegularMiddleware[]
}

const mergeContext = (context: any) => (res: any) => {
  if (res && res !== context) {
    Object.assign(context, res);
  }
  return res;
};

export function fromBeforeHook (hook: RegularMiddleware) {
  return (context: any, next: any) => {
    context.type = 'before';

    return Promise.resolve(hook.call(context.self, context))
      .then(mergeContext(context))
      .then(() => {
        context.type = null;
        return next();
      });
  };
}

export function fromAfterHook (hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return next()
      .then(() => {
        context.type = 'after';
        return hook.call(context.self, context);
      })
      .then(mergeContext(context))
      .then(() => {
        context.type = null;
      });
  };
}

export function fromErrorHooks (hooks: RegularMiddleware[]) {
  return (context: any, next: any) => {
    return next().catch((error: any) => {
      let promise: Promise<any> = Promise.resolve();

      context.original = { ...context };
      context.error = error;
      context.type = 'error';

      delete context.result;

      for (const hook of hooks) {
        promise = promise
          .then(() => hook.call(context.self, context))
          .then(mergeContext(context));
      }

      return promise.then(() => {
        context.type = null;

        if (context.result === undefined) {
          throw context.error;
        }
      });
    });
  };
}

export function collect ({ before = [], after = [], error = [] }: RegularHookMap) {
  const beforeHooks = before.map(fromBeforeHook);
  const afterHooks = [...after].reverse().map(fromAfterHook);
  const errorHooks: any = fromErrorHooks(error);

  return compose([errorHooks, ...afterHooks, ...beforeHooks]);
}