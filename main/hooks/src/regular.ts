import { compose } from './compose';
import { HookContext } from './base';

export type RegularMiddleware<T extends HookContext = any> = (context: T) => Promise<any> | any;
export interface RegularHookMap {
  before?: RegularMiddleware[],
  after?: RegularMiddleware[],
  error?: RegularMiddleware[]
}

const runHook = (hook: RegularMiddleware, context: any, type?: string) => {
  if (type) context.type = type;
  return Promise.resolve(hook.call(context.self, context))
    .then((res: any) => {
      if (type) context.type = null;
      if (res && res !== context) {
        Object.assign(context, res);
      }
    });
};

export function fromBeforeHook (hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return runHook(hook, context, 'before').then(next);
  };
}

export function fromAfterHook (hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return next().then(() => runHook(hook, context, 'after'));
  }
}

export function fromErrorHook (hook: RegularMiddleware) {
  return (context: any, next: any) => {
    return next().catch((error: any) => {
      if (context.error !== error || context.result !== undefined) {
        (context as any).original = { ...context };
        context.error = error;
        delete context.result;
      }

      return runHook(hook, context, 'error').then(() => {
        if (context.result === undefined && context.error !== undefined) {
          throw context.error;
        }
      });
    });
  }
}

export function collect ({ before = [], after = [], error = [] }: RegularHookMap) {
  const beforeHooks = before.map(fromBeforeHook);
  const afterHooks = [...after].reverse().map(fromAfterHook);
  const errorHooks: any = error.map(fromErrorHook);

  return compose([...errorHooks, ...afterHooks, ...beforeHooks]);
}