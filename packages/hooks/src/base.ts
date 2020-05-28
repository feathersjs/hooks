import { Middleware } from './compose';
import { copyToSelf } from './utils';

export const HOOKS: string = Symbol('@feathersjs/hooks') as any;

export type HookContextData = { [key: string]: any };

/**
 * The base hook context.
 */
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

export type HookDefaultsInitializer = (self?: any, args?: any[], context?: HookContext) => HookContextData;

export class HookManager {
  _parent?: this|null = null;
  _params: string[] = [];
  _middleware: Middleware[] = [];
  _props: HookContextData = {};
  _defaults: HookDefaultsInitializer;

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

    return otherMiddleware.concat(this.getMiddleware().reverse());
  }

  props (props: HookContextData) {
    Object.assign(this._props, props);

    return this;
  }

  getProps (): HookContextData {
    const previous = this._parent ? this._parent.getProps() : {};

    return Object.assign({}, previous, this._props);
  }

  params (...params: string[]) {
    this._params = params;

    return this;
  }

  getParams (): string[] {
    const previous = this._parent ? this._parent.getParams() : [];

    return previous.concat(this._params);
  }

  defaults (defaults: HookDefaultsInitializer) {
    this._defaults = defaults;

    return this;
  }

  getDefaults (self: any, args: any[], context: HookContext): HookContextData {
    const previous = this._parent ? this._parent.getDefaults(self, args, context) : {};
    const defaults = typeof this._defaults === 'function' ? this._defaults(self, args, context) : {};

    return Object.assign({}, previous, defaults);
  }

  getContextClass (Base: HookContextConstructor = HookContext): HookContextConstructor {
    const ContextClass = class ContextClass extends Base {
      constructor (data: any) {
        super(data);

        copyToSelf(this);
      }
    };
    const params = this.getParams();
    const props = this.getProps();

    params.forEach((name, index) => {
      if (props[name]) {
        throw new Error(`Hooks can not have a property and param named '${name}'. Use .defaults instead.`);
      }

      Object.defineProperty(ContextClass.prototype, name, {
        enumerable: true,
        get () {
          return this?.arguments[index];
        },
        set (value: any) {
          this.arguments[index] = value;
        }
      });
    });

    Object.assign(ContextClass.prototype, props);

    return ContextClass;
  }

  initializeContext (self: any, args: any[], context: HookContext): HookContext {
    const ctx = this._parent ? this._parent.initializeContext(self, args, context) : context;
    const defaults = this.getDefaults(self, args, ctx);

    if (self) {
      ctx.self = self;
    }

    ctx.arguments = args;

    for (const name of Object.keys(defaults)) {
      if (ctx[name] === undefined) {
        ctx[name] = defaults[name];
      }
    }

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
