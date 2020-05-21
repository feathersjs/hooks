<h1>@feathersjs/hooks</h1>

[![CI GitHub action](https://github.com/feathersjs/hooks/workflows/Node%20CI/badge.svg)](https://github.com/feathersjs/hooks/actions?query=workflow%3A%22Node+CI%22)

`@feathersjs/hooks` brings middleware to any async JavaScript or TypeScript function. It allows to create composable and reusable workflows that can add

- Logging 
- Profiling
- Validation
- Caching/Debouncing
- Permissions
- Data pre- and postprocessing
- etc.

To a function or class without having to change its original code while also keeping everything cleanly separated and testable. See the [⚓ release post for a quick overview](https://blog.feathersjs.com/async-middleware-for-javascript-and-typescript-31a0f74c0d30).

<!-- TOC -->

- [Installation](#installation)
  - [Node](#node)
  - [Deno](#deno)
  - [Browser](#browser)
- [Quick Example](#quick-example)
  - [JavaScript](#javascript)
  - [TypeScript](#typescript)
- [Documentation](#documentation)
  - [Middleware](#middleware)
  - [Hook Context](#hook-context)
    - [Context properties](#context-properties)
    - [Arguments](#arguments)
    - [Using named parameters](#using-named-parameters)
    - [Default values](#default-values)
    - [Modifying the result](#modifying-the-result)
    - [Calling the original](#calling-the-original)
    - [Customizing and returning the context](#customizing-and-returning-the-context)
  - [Options](#options)
    - [params(...names)](#paramsnames)
    - [props](#props)
    - [defaults](#defaults)
  - [Function hooks](#function-hooks)
  - [Object hooks](#object-hooks)
  - [Class hooks](#class-hooks)
    - [JavaScript](#javascript-1)
    - [TypeScript](#typescript-1)
- [Best practises](#best-practises)
- [More Examples](#more-examples)
  - [Cache](#cache)
  - [Permissions](#permissions)
  - [Cleaning up GraphQL resolvers](#cleaning-up-graphql-resolvers)
- [License](#license)

<!-- /TOC -->

# Installation

## Node

```
npm install @feathersjs/hooks --save
yarn add @feathersjs/hooks
```

## Deno

```js
import { hooks } from 'https://unpkg.com/@feathersjs/hooks@latest/deno/index.ts';
```

> __Note:__ You might want to replace `latest` with the actual version you want to use (e.g. `https://unpkg.com/@feathersjs/hooks@^0.2.0/deno/index.ts`)

## Browser

`@feathersjs/hooks` is compatible with any module loader like Webpack and can be included in the browser directly via:

```html
<script type="text/javascript" src="//unpkg.com/@feathersjs/hooks@^0.2.0/dist/hooks.js"></script>
```

Which will make a `hooks` global variable available.

# Quick Example

## JavaScript

The following example logs information about a function call:

```js
const { hooks } = require('@feathersjs/hooks');

const logRuntime = async (context, next) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();

  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

// Hooks can be used with a function like this:
const sayHello = hooks(async name => {
  return `Hello ${name}!`;
}, [
  logRuntime
]);

// And on an object or class like this
class Hello {
  async sayHi (name) {
    return `Hi ${name}`
  }
}

hooks(Hello, {
  sayHi: [
    logRuntime
  ]
});

(async () => {
  console.log(await sayHello('David'));

  // The following would throw an error
  // await sayHello('   ');

  const hi = new Hello();

  console.log(await hi.sayHi('Dave'));
})();
```

## TypeScript

In addition to the normal JavaScript use, with the `experimentalDecorators` option in `tsconfig.json` enabled

```json
"experimentalDecorators": true, /* Enables experimental support for ES7 decorators. */
```

Hooks can be registered using a decorator:

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
  // The following would throw an error
  // console.log(await hi.sayHi('  '));
})();
```

# Documentation

## Middleware

Middleware functions (or hook functions) take a `context` and an asynchronous `next` function as their parameters. The `context` contains information about the function call (like the arguments, the result or `this` context) and the `next` function can be called to continue to the next hook or the original function.

A middleware function can do things before calling `await next()` and after all following middleware functions and the function call itself return. It can also `try/catch` the `await next()` call to handle and modify errors. This is the same control flow that the web framework [KoaJS](https://koajs.com/) uses for handling HTTP requests and response.

Each hook function wraps _around_ all other functions (like an onion). This means that the first registered middleware function will run first before `await next()` and as the very last after all following hooks.

![Feathers hooks image](https://user-images.githubusercontent.com/338316/72454734-44e8d680-3776-11ea-90ed-c81b2d98e8e5.png)

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

## Hook Context

The hook `context` in a [middleware function](#middleware) is an object that contains information about the function call. 

### Context properties

The default properties available are:

- `context.arguments` - The arguments of the function as an array
- `context.method` - The name of the function (if it belongs to an object or class)
- `context.self` - The `this` context of the function being called (may not always be available e.g. for top level arrow functions)
- `context.result` - The result of the method call
- `context[name]` - Value of a named parameter when [using named arguments](#using-named-parameters)

### Arguments

By default, the function call arguments will be available as an array in `context.arguments`. The values can be modified to change what is passed to the original function call:

```js
const { hooks } = require('@feathersjs/hooks');

const sayHello = async (firstName, lastName) => {
  return `Hello ${firstName} ${lastName}!`;
};

const wrappedSayHello = hooks(sayHello, [
  async (context, next) => {
    // Replace the `lastName`
    context.arguments[1] = 'X';
    await next();
  }
]);

(async () => {
  console.log(await wrappedSayHello('David', 'L')); // Hello David X
})();
```

### Using named parameters

It is also possible to turn the arguments into named parameters. In the above example we probably want to have `context.firstName` and `context.lastName` available. To do this, the [`context` option](#options) can be initialized like this:

```js
const { hooks, middleware } = require('@feathersjs/hooks');

const sayHello = async (firstName, lastName) => {
  return `Hello ${firstName} ${lastName}!`;
};

const manager = middleware([
  async (context, next) => {
    // Now we can modify `context.lastName` instead
    context.lastName = 'X';
    await next();
  }
]).params('firstName', 'lastName');
const wrappedSayHello = hooks(sayHello, manager);

// Or all together
const wrappedSayHello = hooks(sayHello, middleware([
  async (context, next) => {
    // Now we can modify `context.lastName` instead
    context.lastName = 'X';
    await next();
  }
]).params('firstName', 'lastName'));

(async () => {
  console.log(await wrappedSayHello('David', 'L')); // Hello David X
})();
```

> __Note:__ When using named parameters, `context.arguments` is read only.

### Default values


> __Note:__ Even if your original function contains a default value, it is important to specify it because the middleware runs before and the value will be `undefined` without a default value.

### Modifying the result

In a hook function, `context.result` can be

- Set _before_ calling `await next()` to skip the original function call. Other hooks will still run.
- Modified _after_ calling `await next()` to modify what is being returned by the function.

See the [cache example](#cache) for how this can be used.

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

To add additional data to the context an instance of a hook context created via `fn.createContext(data)` can be passed as the last argument of a hook-enabled function call. In that case, the up to date context object with all the information (like `context.result`) will be returned:

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

const customContext = sayHello.createContext({
  message: 'Hi from context'
});

(async () => {
  const finalContext = await sayHello('Dave', customContext);
  
  console.log(finalContext);
})();
```

## Options

Instead an array of middleware, a chainable middleware manager that allows to set additional options can be passed like this:

```js
const { hooks, middleware } = require('@feathersjs/hooks');

// Initialize middleware manager with name parameter 'name'
const manager = middleware([
  hook1,
  hook2,
  hook3
]);
const sayHelloWithHooks = hooks(sayHello, manager);

// Or all together
const sayHelloWithHooks = hooks(sayHello, middleware([
  hook1,
  hook2,
  hook3
]));

(async () => {
  await sayHelloWithHooks('David');
})();
```

### params(...names)

Inititalizes a list of named parameters.

```js
const sayHelloWithHooks = hooks(sayHello, middleware([
  hook1,
  hook2,
  hook3
]).params('name'));
```

### props

Initializes properties on the `context`

```js
// Or all together
const sayHelloWithHooks = hooks(sayHello, middleware([
  hook1,
  hook2,
  hook3
]).params('name').props({
  customProperty: true
}));
```

### defaults

## Function hooks

`hooks(fn, middleware[]|settings)` returns a new function that wraps `fn` with `middleware`

```js
const { hooks, middleware } = require('@feathersjs/hooks');

const sayHello = async name => {
  return `Hello ${name}!`;
};

const wrappedSayHello = hooks(sayHello, middleware([
  async (context, next) => {
    console.log(context.someProperty);
    await next();
  }
]).params('name'));

(async () => {
  console.log(await wrappedSayHello('David'));
})();
```

> __Important:__ A wrapped function will _always_ return a Promise even it was not originally `async`.

## Object hooks

`hooks(obj, middlewareMap)` takes an object and wraps the functions indicated in `middlewareMap`. It will modify the existing Object `obj`:

```js
const { hooks, middleware } = require('@feathersjs/hooks');

const o = {
  async sayHi (name, quote) {
    return `Hi ${name} ${quote}`;
  }

  async sayHello (name) {
    return `Hello ${name}!`;
  }
}

hooks(o, {
  sayHello: [ logRuntime ],
  sayHi: [ logRuntime ]
});

// With additional options
hooks(o, {
  sayHello: middleware([ logRuntime ]).params('name', 'quote'),
  sayHi: middleware([ logRuntime ]).params('name')
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

## Class hooks

Similar to object hooks, class hooks modify the class (or class prototype). Just like for objects it is possible to register hooks that are global to the class or object. Registering hooks also works with inheritance.

> __Note:__ Object or class level global hooks will only run if the method itself has been enabled for hooks. This can be done by registering hooks with an empty array.

### JavaScript

```js
const { hooks } = require('@feathersjs/hooks');

class HelloSayer {
  async sayHello (name) {
    return `Hello ${name}`;
  }
}

class HappyHelloSayer extends HelloSayer {
  async sayHello (name) {
    const baseHello = await super.sayHello(name);
    return baseHello + '!!!!! :)';
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
hooks(HelloSayer.prototype, {
  sayHello: [async (context, next) => {
    console.log('Hook on HelloSayer.sayHello');
    await next();
  }]
});

(async () => {
  const happy = new HappyHelloSayer();

  console.log(await happy.sayHello('David'));
})();
```

### TypeScript

With decorators and inheritance

```js
import { hooks, withParams, HookContext, NextFunction } from '@feathersjs/hooks';

@hooks([
  async (context: HookContext, next: NextFunction) => {
    console.log('Hook on HelloSayer');
    await next();
  }
])
class HelloSayer {
  @hooks({
    context: withParams('name'),
    middleware: [
      async (context: HookContext, next: NextFunction) => {
        console.log('Hook on HelloSayer.sayHello');
        await next();
      }
    ]
  })
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

# Best practises

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
  }, middleware([ updateQuery ]).params('query'));
  ```

# More Examples

## Cache

The following example is a simple hook that caches the results of a function call and uses the cached value. It will clear the cache every 5 seconds. This is useful for any kind of expensive method call like an external HTTP request:

```js
const { hooks } = require('@feathersjs/hooks');
const cache = () => {
  let cacheData = {};

  // Reset entire cache every 5 seconds
  setInterval(() => {
    cacheData = {};
  }, 5000);
  
  return async (context, next) => {
    const key = JSON.stringify(context);

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

## Permissions

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
}, middleware([ checkPermission('admin') ]).params('id', 'user'));
```

## Cleaning up GraphQL resolvers

The above examples can both be useful for speeding up and locking down existing [GraphQL resolvers](https://graphql.org/learn/execution/): 

```js
const { hooks, withParams } = require('@feathersjs/hooks');

const checkPermission = name => async (ctx, next) => {
  const { context } = ctx;
  if (!context.user.permissions.includes(name)) {
    throw new Error(`User does not have ${name} permission`);
  }

  await next();
}

const resolvers = {
  Query: {
    human: hooks(async (obj, args, context, info) => {
      return context.db.loadHumanByID(args.id).then(
        userData => new Human(userData)
      )
    }, middleware([
      cache(),
      checkPermission('admin')
    ]).params('obj', 'args', 'context', 'info'))
  }
}
```

# License

Copyright (c) 2020

Licensed under the [MIT license](LICENSE).
