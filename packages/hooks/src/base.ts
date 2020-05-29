import { Middleware } from './compose';

export const HOOKS: string = Symbol('@feathersjs/hooks') as any;

export type HookContextData = { [key: string]: any };

export class HookContext<T = any, C = any> {
  result?: T;
  method?: string;
  self: C;
  arguments: any[];
  [key: string]: any;

  constructor (data: HookContextData = {}) {
    Object.assign(this, data);
  }
}

export type HookContextConstructor = new (data?: { [key: string]: any }) => HookContext;

export type HookDefaultsInitializer = (context: HookContext) => HookContextData;

export class HookManager {
  _parent?: this|null = null;
  _middleware: Middleware[] = [];

  parent (parent: this) {
    this._parent = parent;

    return this;
  }

  middleware (middleware: Middleware[]) {
    this._middleware = middleware;

    return this;
  }

  getMiddleware (): Middleware[] {
    const previous = this._parent ? this._parent.getMiddleware() : [];

    return previous.concat(this._middleware);
  }

   collectMiddleware (self: any, _args: any[]): Middleware[] {
    const otherMiddleware = getMiddleware(self);

    return otherMiddleware.concat(this.getMiddleware());
  }


  initializeContext (self: any, args: any[], context: HookContext): HookContext {
    const ctx = this._parent ? this._parent.initializeContext(self, args, context) : context;

    if (self) {
      ctx.self = self;
    }

    ctx.arguments = args;

    return ctx;
  }
}

export type HookOptions = HookManager|Middleware[];

export function convertOptions (options: HookOptions = []) {
  return Array.isArray(options) ? new HookManager().middleware(options) : options;
}

export function getManager (target: any): HookManager|null {
  return (target && target[HOOKS]) || null;
}

export function setManager<T> (target: T, manager: HookManager) {
  const parent = getManager(target);

  (target as any)[HOOKS] = manager.parent(parent);

  return target;
}

export function getMiddleware (target: any): Middleware[] {
  const manager = getManager(target);

  return manager ? manager.getMiddleware() : [];
}

export function setMiddleware<T> (target: T, middleware: Middleware[]) {
  const manager = new HookManager().middleware(middleware);

  return setManager(target, manager);
}
