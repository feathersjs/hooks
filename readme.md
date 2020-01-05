# @feathersjs/hooks

[![CI GitHub action](https://github.com/feathersjs/hooks/workflows/Node%20CI/badge.svg)](https://github.com/feathersjs/hooks/actions?query=workflow%3A%22Node+CI%22)

`@feathersjs/hooks` brings middleware to any async JavaScript or TypeScript function. It allows to create composable and reusable workflows that can add things like

- Logging
- Profiling
- Validation
- Caching
- Checking permissions
- etc.

To any function or class without having to change the original code.

<!-- TOC -->

- [@feathersjs/hooks](#feathersjshooks)
  - [Installation](#installation)
  - [Quick Example](#quick-example)
    - [JavaScript](#javascript)
    - [TypeScript](#typescript)
  - [Documentation](#documentation)
    - [Middleware](#middleware)
    - [Function hooks](#function-hooks)
    - [Object hooks](#object-hooks)
    - [Class hooks](#class-hooks)
  - [Hook Context](#hook-context)
    - [Context properties](#context-properties)
    - [Modifying the result](#modifying-the-result)
    - [Using named parameters](#using-named-parameters)
    - [Customizing and returning the context](#customizing-and-returning-the-context)
  - [More Examples](#more-examples)
    - [Cache results](#cache-results)
  - [License](#license)

<!-- /TOC -->

## Installation

```
npm install @feathersjs/hooks --save
```

## Quick Example

### JavaScript

The following example logs information about a function call:

```js
const { hooks } = require('@feathersjs/hooks');
const logInformation = async (context, next) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();

  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

// Hooks can be used with a function like this:
const sayHello = hooks(async name => {
  return `Hello ${name}!`;
}, [ logInformation ]);

(async () => {
  console.log(await sayHello('David'));
})();

// And on an object or class like this
class Hello {
  async sayHi (name) {
    return `Hi ${name}`
  }
}

hooks(Hello, {
  sayHi: [ logInformation ]
});

(async () => {
  const hi = new Hello();

  hi.sayHi();
})();
```

### TypeScript

With the following options in the `tsconfig.json` enabled:

```json
"experimentalDecorators": true, /* Enables experimental support for ES7 decorators. */
```

Hooks can also be used as a decorator:

```ts
import { hooks, HookContext, NextFunction } from '@feathersjs/hooks';

const logInformation = async (context: HookContext, next: NextFunction) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();

  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

// And on an object or class like this
class Hello {
  @hooks([
    logInformation
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

Middleware functions (or hook functions) take a `context` and an asynchronous `next` function as their parameters that allow it to wrap around another function.

A middleware function can do things before calling `await next()` and after all other hooks and the function call return. It can also `try/catch` the `await next()` call to handle and modify errors. This is the same control flow as in [KoaJS](https://koajs.com/).

Basically, each hook function wraps _around_ all other functions (like an onion). This means that the first registered middleware function will run first before `await next()` and as the very last after all following hooks after `await next()`.

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

> __Important:__ A wrapped function will _always_ return a Promise even it is not `async`.

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
  sayHello: [ logInformation ],
  sayHi: [ logInformation ]
});

// With `updateContext` and named parameters
hooks(o, {
  sayHello: [ logInformation ],
  sayHi: [ logInformation ]
}, {
  sayHello: withParams('name'),
  sayHi: withParams('name')
});
```

Hooks can also be registered at the object level which will run before any specific hooks on a hook enabled functions:

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
  sayHi: [ logInformation ]
});
```

### Class hooks

Similar to object hooks, class hooks modify the class (or class prototype). Just like for objects it is possible to register global hooks. Registering hooks also works with inheritance:

__JavaScript:__

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

__TypeScript:__ (with decorators and inheritance)

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
  return `Hello ${message} ${punctuationMark}`;
}, [ logMessage ], withParams('message', 'punctuationMark'));

(async () => {
  console.log(await sayHello('Steve', '!!')); // Hello Steve??
})();
```

> __Note:__ When using named parameters, `context.arguments` is read only.

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

## More Examples

### Cache results

The following example is a simple hook that caches the results of a function call and uses the cached value if available. This is useful e.g. for external Ajax requests:

```js
const hooks = require('@feathersjs/hooks');
const cache = () => {
  const cacheData = {};
  
  return async (ctx, next) => {
    const key = JSON.stringify(ctx);

    if (cacheData[key]) {
      ctx.result = cacheData[key];

      return next();
    }

    await next();

    cacheData[key] = ctx.result;)
  }
}

const getData = hooks(async url => {
  return axios.get(url);
}, [ cache() ]);

await getData('http://url-that-takes-long-to-respond');
```

As a decorator:

```js
import hooks from '@feathersjs/hooks';

class Api {
  @hooks([
    logInformation,
    cache()
  ])
  async getMessages () {
    const { data } = axios.get('http://myserver.com/users');

    return data;
  }
}
```

## License

Copyright (c) 2020

Licensed under the [MIT license](LICENSE).
