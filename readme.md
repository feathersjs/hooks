# @feathersjs/hooks

[![CI GitHub action](https://github.com/feathersjs/hooks/workflows/Node%20CI/badge.svg)](https://github.com/feathersjs/hooks/actions?query=workflow%3A%22Node+CI%22) [![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs/hooks.svg)](https://greenkeeper.io/)

`@feathersjs/hooks` brings middleware to any async JavaScript or TypeScript function. It allows to create composable and reusable workflows that can add

- Logging 
- Profiling
- Validation
- Caching/Debouncing
- Permissions
- Data pre- and postprocessing
- etc.

To a function or class without having to change its original code while also keeping everything cleanly separated and testable.

<!-- TOC -->

- [@feathersjs/hooks](#feathersjshooks)
  - [Installation](#installation)
    - [Node](#node)
    - [Deno](#deno)
  - [Quick Example](#quick-example)
    - [JavaScript](#javascript)
    - [TypeScript](#typescript)
  - [Documentation](#documentation)
    - [Middleware](#middleware)
    - [Function hooks](#function-hooks)
    - [Object hooks](#object-hooks)
    - [Class hooks](#class-hooks)
      - [JavaScript](#javascript-1)
      - [TypeScript](#typescript-1)
  - [Hook Context](#hook-context)
    - [Context properties](#context-properties)
    - [Modifying the result](#modifying-the-result)
    - [Using named parameters](#using-named-parameters)
    - [Calling the original](#calling-the-original)
    - [Customizing and returning the context](#customizing-and-returning-the-context)
  - [Best practises](#best-practises)
  - [More Examples](#more-examples)
    - [Cache](#cache)
    - [Permissions](#permissions)
  - [License](#license)

<!-- /TOC -->

## Installation

### Node

```
npm install @feathersjs/hooks --save
yarn add @feathersjs/hooks
```

### Deno

```
import { hooks } from 'https://unpkg.com/@feathersjs/hooks@latest/deno/index.ts';
```

> __Note:__ You might want to replace `latest` with the actual version you want to use (e.g. `https://unpkg.com/@feathersjs/hooks@0.2.0/deno/index.ts`)

## Quick Example

### JavaScript

The following example logs information about a function call:

```js
const { hooks } = require('@feathersjs/hooks');
const logRuntime = async (context, next) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();

  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

const sayHello = async name => {
  return `Hello ${name}!`;
}

// Hooks can be used with a function like this:
const hookSayHello = hooks(sayhello, [ logRuntime ]);

(async () => {
  console.log(await hookSayHello('David'));
})();

// And on an object or class like this
class Hello {
  async sayHi (name) {
    return `Hi ${name}`
  }
}

hooks(Hello, {
  sayHi: [ logRuntime ]
});

(async () => {
  const hi = new Hello();

  hi.sayHi();
})();
```

### TypeScript

In addition to the normal JavaScript use, with the `experimentalDecorators` option in the `tsconfig.json` enabled

```json
"experimentalDecorators": true, /* Enables experimental support for ES7 decorators. */
```

Hooks can also be registered using a decorator:

```ts
import { hooks, HookContext, NextFunction } from '@feathersjs/hooks';

const logRuntime = async (context: HookContext, next: NextFunction) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();

  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

class Hello {
  @hooks([
    logRuntime
  ])
  async sayHi (name: string) {
    return `Hi ${name}`;
  }
}

(async () => {
  const hi = new Hello();

  console.log(await hi.sayHi('David'));
})();
```

## Documentation

### Middleware

Middleware functions (or hook functions) take a `context` and an asynchronous `next` function as their parameters. The `context` contains information about the function call (like the arguments, the result or `this` context) and the `next` function can be called to continue to the next hook or actual function.

A middleware function can do things before calling `await next()` and after all following middleware functions and the function call itself return. It can also `try/catch` the `await next()` call to handle and modify errors. This is the same control flow that the web framework [KoaJS](https://koajs.com/) uses for handling HTTP requests and response.

Each hook function wraps _around_ all other functions (like an onion). This means that the first registered middleware function will run first before `await next()` and as the very last after all following hooks.

![Hook function image]()

The following example:

```js
const { hooks } = require('@feathersjs/hooks');

const sayHello = async message => {
  console.log(`Hello ${message}!`)
};

const hook1 = async (ctx, next) => {
  console.log('hook1 before');
  await next();
  console.log('hook1 after')
}

const hook2 = async (ctx, next) => {
  console.log('hook2 before');
  await next();
  console.log('hook2 after')
}

const hook3 = async (ctx, next) => {
  console.log('hook3 before');
  await next();
  console.log('hook3 after')
}

const sayHelloWithHooks = hooks(sayHello, [
  hook1,
  hook2,
  hook3
]);

(async () => {
  await sayHelloWithHooks('David');
})();
```

Would print:

```
hook1 before
hook2 before
hook3 before
Hello David
hook3 after
hook2 after
hook1 after
```

### Function hooks

`hooks(fn, middleware[], updateContext?)` returns a new function that wraps `fn` with `middleware`. `updateContext` is an optional function with `(self, arguments, context)` that takes an initial hook context and updates it with information about this method call. This is usually used for [named parameters](#using-named-parameters).

```js
const { hooks } = require('@feathersjs/hooks');

const sayHello = async name => {
  return `Hello ${name}!`;
};

const wrappedSayHello = hooks(sayHello, [
  async (context, next) => {
    console.log(context.someProperty);
    await next();
  }
], (self, args, context) => {
  context.self = self;
  context.arguments = args;
  context.someProperty = 'Set from updateContext';

  return context;
});

(async () => {
  console.log(await wrappedSayHello('David'));
})();
```

> __Important:__ A wrapped function will _always_ return a Promise even it was not originally `async`.

### Object hooks

`hooks(obj, middlewareMap, updateContextMap?)` takes an object and wraps the functions in `middlewareMap` with the middleware. It will modify the existing Object `obj`:

```js
const { hooks, withParams } = require('@feathersjs/hooks');

const o = {
  async sayHi (name) {
    return `Hi ${name}!`;
  }

  async sayHello (name) {
    return `Hello ${name}!`;
  }
}

hooks(o, {
  sayHello: [ logRuntime ],
  sayHi: [ logRuntime ]
});

// With `updateContext` and named parameters
hooks(o, {
  sayHello: [ logRuntime ],
  sayHi: [ logRuntime ]
}, {
  sayHello: withParams('name'),
  sayHi: withParams('name')
});
```

Hooks can also be registered at the object level which will run before any specific hooks on a hook enabled function:

```js
const { hooks } = require('@feathersjs/hooks');

const o = {
  async sayHi (name) {
    return `Hi ${name}!`;
  }

  async sayHello (name) {
    return `Hello ${name}!`;
  }
}

// This hook will run first for every hook enabled method on the object
hooks(o, [
  async (context, next) => {
    console.log('Top level hook');
    await next();
  }
]);

hooks(o, {
  sayHi: [ logRuntime ]
});
```

### Class hooks

Similar to object hooks, class hooks modify the class (or class prototype). Just like for objects it is possible to register hooks that are global to the class or object. Registering hooks also works with inheritance.

> __Note:__ Object or class level global hooks will only run if the method itself has been enabled for hooks. This can be done by registering hooks with an empty array.

#### JavaScript

```js
const { hooks } = require('@feathersjs/hooks');

class HelloSayer {
  async sayHello (name) {
    return `Hello ${name}`;
  }
}

class HappyHelloSayer extends HelloSayer {
  async sayHello (name) {
    return super.sayHello(name) + '!!!!! :)';
  }
}

// To add hooks at the class level we need to use the prototype object
hooks(HelloSayer.prototype, [
  async (context, next) => {
    console.log('Hook on HelloSayer');
    await next();
  }
]);

hooks(HappyHelloSayer.prototype, [
  async (context, next) => {
    console.log('Hook on HappyHelloSayer');
    await next();
  }
]);

// Methods can also be wrapped directly on the class
hooks(HelloSayer, {
  sayHello: [async (context, next) => {
    console.log('Hook on HelloSayer.sayHello');
    await next();
  }]
});

(async () => {
  const happy = new HappyHelloSayer();

  await happy.sayHello('David');
})();
```

#### TypeScript

With decorators and inheritance

```js
import { hooks, HookContext, NextFunction } from '@feathersjs/hooks';

@hooks([
  async (context: HookContext, next: NextFunction) => {
    console.log('Hook on HelloSayer');
    await next();
  }
])
class HelloSayer {
  @hooks([
    async (context: HookContext, next: NextFunction) => {
      console.log('Hook on HelloSayer.sayHello');
      await next();
    }
  ])
  async sayHello (name: string) {
    return `Hello ${name}`;
  }

  async otherMethod () {
    return 'This will not run any hooks';
  }
}

@hooks([
  async (context: HookContext, next: NextFunction) => {
    console.log('Hook on HappyHelloSayer');
    await next();
  }
])
class HappyHelloSayer extends HelloSayer {
  async sayHello (name: string) {
    const message = await super.sayHello(name);
    return `${message}!!!!! :)`;
  }
}

(async () => {
  const happy = new HappyHelloSayer();

  console.log(await happy.sayHello('David'));
})();
```

> __Note:__ Decorators only work on classes and class methods, not on functions. Standalone (arrow) functions require the [JavaScript function style](#function-hooks) hook registration.

## Hook Context

The hook context is an object that contains information about the function call. 

### Context properties

The default properties available are:

- `context.arguments` - The arguments of the function as an array
- `context.method` - The name of the function (if it belongs to an object or class)
- `context.self` - The `this` context of the function being called (may not always be available e.g. for top level arrow functions)
- `context.result` - The result of the method call
- `context[name]` - Value of a named parameter when [using named arguments](#using-named-arguments)

### Modifying the result

In a hook function, `context.result` can be

- Set _before_ calling `await next()` to skip the actual function call. Other hooks will still run.
- Modified _after_ calling `await next()` to modify what is being returned by the function call

### Using named parameters

By default, `context.arguments` contains the array of the function call arguments and can be modified before calling `await next()`. To turn the arguments into named parameters, `withParams` can be used like this:

```js
const { hooks, withParams } = require('@feathersjs/hooks');

const logMessage = async (context, next) => {
  console.log('Context', context.message, context.punctuationMark);
  // Can also be modified for the following hooks and the function call
  context.punctuationMark = '??';

  await next();
};

const sayHello = hooks(async (message, punctuationMark) => {
  return `Hello ${message}${punctuationMark}`;
}, [ logMessage ], withParams('message', 'punctuationMark'));

(async () => {
  console.log(await sayHello('Steve', '!!')); // Hello Steve??
})();
```

> __Note:__ When using named parameters, `context.arguments` is read only.

### Calling the original

The original function without any hooks is available as `fn.original`:

```js
const { hooks } = require('@feathersjs/hooks');
const emphasize = async (context, next) => {
  await next();

  context.result += '!!!';
};
const sayHello = hooks(async name => `Hello ${name}`, [ emphasize ]);

const o = hooks({
  async sayHi(name) {
    return `Hi ${name}`;
  }
}, {
  sayHi: [ emphasize ]
});

(async () => {
  console.log(await sayHello.original('Dave')); // Hello Dave
  // Originals on object need to be called with an explicit `this` context
  console.log(await o.sayHi.original.call(o, 'David'))
})();
```

### Customizing and returning the context

To add additional data to the context an instance of `HookContext` can be passed as the last argument of a hook-enabled function call. In that case, the up to date context object with all the information (like `context.result`) will be returned:

```js
const { hooks, HookContext } = require('@feathersjs/hooks');
const customContextData = async (context, next) => {
  console.log('Custom context message is', context.message);

  context.customProperty = 'Hi';

  await next();
}

const sayHello = hooks(async message => {
  return `Hello ${message}!`;
}, [ customContextData ]);

const customContext = new HookContext({
  message: 'Hi from context'
});

(async () => {
  const finalContext = await sayHello('Dave', customContext);
  
  console.log(finalContext.customProperty); // Hi
  console.log(finalContext.result); // Hello Dave
})();
```

## Best practises

- Hooks can be registered at any time by calling `hooks` again but registration should be kept in one place for better visibility.
- Decorators make the flow even more visible by putting it right next to the code the hooks are affecting.
- The `context` will always be the same object in the hook flow. You can set any property on it.
- If a parameter is an object, modifying that object will change the original parameter. This can cause subtle issues that are difficult to debug. Using the spread operator to add the new property and replacing the context property helps to avoid many of those problems:

  ```js
  const updateQuery = async (context, next) => {
    // NOT: context.query.newProperty = 'something';

    // Instead
    context.query = {
      ...context.query,
      active: true
    }

    await next();
  }

  const findUser = hooks(async query => {
    return collection.find(query);
  }, [ updateQuery ], withParams('query'));
  ```

## More Examples

### Cache

The following example is a simple hook that caches the results of a function call and uses the cached value. It will clear the cache every 5 seconds. This is useful for any kind of expensive method call like an external HTTP request:

```js
const hooks = require('@feathersjs/hooks');
const cache = () => {
  let cacheData = {};

  // Reset entire cache every 5 seconds
  setInterval(() => {
    cacheData = {};
  }, 5000);
  
  return async (context, next) => {
    const key = JSON.stringify(ctx);

    if (cacheData[key]) {
      // Setting context.result before `await next()`
      // will skip the (expensive function call) and
      // make it return the cached value
      context.result = cacheData[key];
    }

    await next();
    
    // Set the cached value to the result
    cacheData[key] = context.result;
  }
}

const getData = hooks(async url => {
  return axios.get(url);
}, [ cache() ]);

await getData('http://url-that-takes-long-to-respond');
```

### Permissions

When passing e.g. a `user` object to a function call, hooks allow for a better separation of concerns by handling permissions in a hook:

```js
const checkPermission = name => async (context, next) => {
  if (!context.user.permissions.includes(name)) {
    throw new Error(`User does not have ${name} permission`);
  }

  await next();
}

const deleteInvoice = hooks(async (id, user) => {
  return collection.delete(id);
}, [ checkPermission('admin') ], withParams('id', 'user'));
```

## License

Copyright (c) 2020

Licensed under the [MIT license](LICENSE).
