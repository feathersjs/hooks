<h1>@feathersjs/hooks</h1>

[![Deno CI](https://github.com/feathersjs/hooks/actions/workflows/deno.yml/badge.svg)](https://github.com/feathersjs/hooks/actions/workflows/deno.yml)

`@feathersjs/hooks` brings middleware-like functionality to any async JavaScript or TypeScript function.  It allows creation of composable and reusable workflows to handle functionality like

- Logging
- Profiling
- Validation
- Caching / Debouncing
- Permissions
- Data pre- and post-processing
- etc.

This functionality can be added without having to change the original function. The pattern also keeps everything cleanly separated and testable.

```ts
import { hooks } from '@feathersjs/hooks';

// We're going to wrap `sayHi` with hook middleware.
class Hello {
  async sayHi (name) {
    return `Hi ${name}`
  }
}

// This logRuntime hook will be used as middleware
const logRuntime = async (context, next) => {
  const start = new Date().getTime();

  await next(); // In this example, `next` is `sayHi`.

  const duration = new Date().getTime() - start;
  console.log(`Function '${context.method}' returned '${context.result}' after ${duration}ms`);
}

// The `hooks` utility wraps `logRuntime` around `sayHi`.
hooks(Hello, {
  sayHi: [ logRuntime ]
});

// Calling `sayHi` will start by calling the `logRuntime` hook.
(async () => {
  const hi = new Hello();

  console.log(await hi.sayHi('Dave'));
})();
```

The Hooks middleware pattern was originally implemented directly in [FeathersJS](https://www.feathersjs.com). Having been recognized as a powerful pattern with more broad-scale usefulness, it has been extracted from FeathersJS into this standalone utility.

See the [⚓ release post for a quick overview](https://blog.feathersjs.com/async-middleware-for-javascript-and-typescript-31a0f74c0d30).

- [Installation](#installation)
  - [Node](#node)
  - [Deno](#deno)
  - [Browser](#browser)
- [Documentation](#documentation)
  - [Intro to Async Hooks](#intro-to-async-hooks)
  - [The `hooks` Function](#the-hooks-function)
    - [Example with a Function](#example-with-a-function)
    - [Example with a Class](#example-with-a-class)
    - [TypeScript with the `@hooks` Decorator](#typescript-with-the-hooks-decorator)
  - [The `middleware` Manager](#the-middleware-manager)
    - [params(...names)](#paramsnames)
    - [props(properties)](#propsproperties)
    - [defaults(callback)](#defaultscallback)
  - [Global Hooks](#global-hooks)
    - [Global Hooks on an Object](#global-hooks-on-an-object)
    - [Global Hooks on a Class](#global-hooks-on-a-class)
      - [JavaScript Example](#javascript-example)
      - [TypeScript Example](#typescript-example)
  - [Hook Context](#hook-context)
    - [Context properties](#context-properties)
    - [Arguments](#arguments)
    - [Using named parameters](#using-named-parameters)
    - [Default values](#default-values)
    - [Modifying the result](#modifying-the-result)
    - [Calling the original function](#calling-the-original-function)
    - [Customizing and returning the context](#customizing-and-returning-the-context)
  - [Flow Control with Multiple Hooks](#flow-control-with-multiple-hooks)
    - [Async Hook Flow](#async-hook-flow)
    - [Regular Hooks](#regular-hooks)
      - [The `collect` utility](#the-collect-utility)
- [Best practises](#best-practises)
- [More Examples](#more-examples)
  - [Cache](#cache)
  - [Permissions](#permissions)
  - [Cleaning up GraphQL resolvers](#cleaning-up-graphql-resolvers)
- [Contributing](#contributing)
- [License](#license)

# Installation

## Node

```shell
npm install @feathersjs/hooks --save
yarn add @feathersjs/hooks
```

## Deno

`@feathersjs/hooks` releases are published to [deno.land/x/hooks](https://deno.land/x/hooks):

```ts
import { hooks } from 'https://deno.land/x/hooks/src/index.ts';
```

## Browser

The `@feathersjs/hooks` npm package works in any modern browser and is compatible with any module loader like Webpack.

# Documentation

## Intro to Async Hooks

The fundamental building block of `@feathersjs/hooks` is the "Async Hook".  An "Async Hook" is an `async` function that accepts two arguments:

- A [`context` object](#hook-context) containing the arguments for the function call.
- An asynchronous `next` function. Somewhere in the body of a hook function, there is a call to `await next()`, which calls the `next` hook OR the original function if all other hooks have run.

In its simplest form, an Async Hook looks like this:

```js
const myAsyncHook = async (context, next) => {
  // Code before `await next()` runs before the main function
  await next();
  // Code after `await next()` runs after the main function.
}
```

Any Async Hook can be wrapped around another function, essentially becoming a middleware function.  Calling `await next()` will either call the next middleware in the chain or the original function if all middleware have run.  In the next section you'll learn how to wrap hooks around other functions.

## The `hooks` Function

`hooks(fn, middleware[]|manager)` returns a new function that wraps `fn` with `middleware`

The `hooks` function wraps one or more [Async Hooks](#intro-to-async-hooks) around another function, setting up the hooks as middleware. The following examples all show the default functionality of passing an array of hooks as the second argument.  Learn about additional functionality in the section about [Middleware Managers](#the-middleware-manager)

### Example with a Function

The example below demonstrates the concept of wrapping the `make_request` function with the `verify_auth` hook function.

```ts
import { hooks } from '@feathersjs/hooks'

const make_request = () => { /* make a request to the database server */ }

const verify_auth = (context, next) => {
  /* Do auth verification before calling `await next()` */
  await next()
}

const request_with_middleware = hooks(make_request, [verify_auth])
```

In the above example, calling `request_with_middleware` will call the `verify_auth` function before calling `make_request`.  The `verify_auth` function will have a `context.arguments` array containing the original arguments for the function call.  A hook can modify the context object before calling `await next()`.  (In this case, the `next` function IS the `make_request` function.)  Alternatively, `verify_auth` could throw an error to prevent the request from ever getting to the `make_request` function.  Check the [hook context](#hook-context) section to learn how to turn the `context.arguments` array into named parameters.

> __Important:__ A wrapped function will _always_ return a Promise even if it was not originally `async`.

We've seen how to wrap a single function, but the `hooks` utility is more powerful.  It can also wrap [object methods](#object-hooks) and [class methods](#class-hooks).  The following example shows how to use it with a class.

### Example with a Class

The following example updates a class's `sayHi` method to log information about a function call.  This syntax also works on plain objects.

```js
const { hooks } = require('@feathersjs/hooks');

// This class has a `sayHi` instance method we're going to wrap with hooks.
// This would also work with an object containing a `sayHi` method.
class Hello {
  async sayHi (name) {
    return `Hi ${name}`
  }
}

// This logRuntime hook will be used as middleware
const logRuntime = async (context, next) => {
  // Code before `await next()` runs before the original function
  const start = new Date().getTime();

  await next();

  // Code after `await next()` runs after the original function.
  const end = new Date().getTime();
  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

// Enhance class (or object) methods using an object of method names as the 2nd argument
hooks(Hello, { sayHi: [ logRuntime ] });

// You can now use the wrapped instance methods inside any async function.
(async () => {
  const hi = new Hello();

  console.log(await hi.sayHi('Dave'));
})();
```

### TypeScript with the `@hooks` Decorator

With TypeScript, you can use `hooks` the same was as shown in the above JavaScript example, or you can use decorators. Using decorators requires the `experimentalDecorators` option in `tsconfig.json` to be enabled.

```json
"experimentalDecorators": true, /* Enables experimental support for ES7 decorators. */
```

Now hooks can be registered using the `@hooks` decorator:

```ts
import { hooks, HookContext, NextFunction } from '@feathersjs/hooks';

const logRuntime = async (context: HookContext, next: NextFunction) => {
  const start = new Date().getTime();

  await next();

  const end = new Date().getTime();
  console.log(`Function '${context.method || '[no name]'}' returned '${context.result}' after ${end - start}ms`);
}

class Hello {
  @hooks([ logRuntime ]) // the @hooks decorator
  async sayHi (name: string) {
    return `Hi ${name}`;
  }
}

(async () => {
  const hi = new Hello();

  console.log(await hi.sayHi('David'));
})();
```

## The `middleware` Manager

You can use a `middleware` manager, instead of a plain array of hook functions, to enable additional functionality.

In all previous examples, when calling `hooks` with an array in the second argument ﹣ either directly like `hooks(someFn, [])` or as the value of an object key like `hooks(someObj, { prop: [] })` ﹣ the array gets wrapped into an internal middleware `Manager`.

The `middleware` function creates a middleware Manager which has three important methods:

- `params()`
- `props()`
- `defaults()`

```js
const { hooks, middleware } = require('@feathersjs/hooks');

const sayHiWithHooks = hooks(sayHi, middleware([ hook1, hook2, hook3 ]));

(async () => {
  await sayHiWithHooks('David');
})();
```

### params(...names)

Supplies names for original function arguments.  Instead of appearing in `params.arguments`, the arguments will be named in the order provided.

```js
const sayHiWithHooks = hooks(sayHi,
  middleware([ hook1, hook2, hook3 ]).params('name', 'age')
);
```

### props(properties)

Initializes properties on the `context`

```js
const sayHiWithHooks = hooks(sayHi,
  middleware([ hook1, hook2, hook3 ]).params('name').props({ customProperty: true })
);
```

> __Note:__ `.props` must not contain any of the field names defined in `.params`.

### defaults(callback)

Calls a `callback(self, arguments, context)` that returns default values which will be set if the property on the hook context is `undefined`. Applies to both, `params` and other properties.

```js
const sayHi = async name => `Hello ${name}`;

const sayHiWithHooks = hooks(sayHi,
  middleware([])
    .params('name')
    .defaults((self, args, context) => {
      return {
        name: 'Unknown human'
      }
    })
);
```

## Global Hooks

Sometimes you want to run a set of hooks on all of the methods in a class or object.

### Global Hooks on an Object

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

// This hook will run first for every hook-enabled method on the object
hooks(o, [
  async (context, next) => {
    console.log('Top level hook');
    await next();
  }
]);
// The global hooks only run if you enable hooks on the method:
hooks(o, {
  sayHello: middleware([ logRuntime ]).params('name', 'quote'),
  sayHi: []
});

hooks(o, {
  sayHi: [ logRuntime ]
});
```

### Global Hooks on a Class

Similar to object hooks, class hooks modify the class (or class prototype). Just like for objects it is possible to register hooks that are global to the class or object. Registering hooks also works with inheritance.

> __Note:__ Object or class level global hooks will only run if the method itself has been enabled for hooks. This can be done by registering hooks with an empty array.

#### JavaScript Example

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

// Add global hooks to the class using its prototype
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

// Enabling hooks on sayHello also allows the global hooks to run.
hooks(HelloSayer, {
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

#### TypeScript Example

Using decorators in TypeScript also respects inheritance:

```js
import { hooks, HookContext, NextFunction } from '@feathersjs/hooks';

@hooks([
  async (context: HookContext, next: NextFunction) => {
    console.log('Hook on HelloSayer');
    await next();
  }
])
class HelloSayer {
  @hooks(middleware([
    async (context: HookContext, next: NextFunction) => {
      console.log('Hook on HelloSayer.sayHello');
      await next();
    }
  ]).params('name'))
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

> __Note:__ When using named parameters, `context.arguments` is read only to preserve the order of named params.

### Default values

You can add default values using the manager's `.defaults()` method. See [manager.defaults()](#defaultscallback)

> __Note:__ Even if your original function contains a default value, it is important to specify it because the middleware runs before and the value will be `undefined` without a default value.

### Modifying the result

In a hook function, `context.result` can be

- Set _before_ calling `await next()` to skip the original function call. Other hooks will still run.
- Modified _after_ calling `await next()` to modify what is being returned by the function.

See the [cache example](#cache) for how this can be used.

### Calling the original function

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

Once a function has been wrapped with `hooks`, the wrapped function will have a `createContext` method.  This method can be used to create a custom context object. This custom context can then be passed as the last argument of a hook-enabled function call. In that case, the up-to-date context object - with all the information (like `context.result`) - will be returned:

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

## Flow Control with Multiple Hooks

### Async Hook Flow

Middleware functions (or hook functions) take a `context` and an asynchronous `next` function as their parameters. The `context` contains information about the function call (like the arguments, the result or `this` context) and the `next` function can be called to continue to the next hook or the original function.

A middleware function can do things before calling `await next()` and after all following middleware functions and the function call itself return. It can also `try/catch` the `await next()` call to handle and modify errors. This is the same control flow that the web framework [KoaJS](https://koajs.com/) uses for handling HTTP requests and response.

Each hook function wraps _around_ all other functions (like an onion). This means that the first registered middleware function will run first before `await next()` and as the very last after all following hooks.

![Feathers hooks image](https://user-images.githubusercontent.com/338316/72454734-44e8d680-3776-11ea-90ed-c81b2d98e8e5.png)

The following example uses hooks named `one`, `two`, and `three` to demonstrate how execution order works:

```js
const { hooks } = require('@feathersjs/hooks');

const sayHello = async message => {
  console.log(`HELLO, ${message}!`)
};

const one = async (ctx, next) => {
  console.log('one   before');
  await next();
  console.log('one   after')
}

const two = async (ctx, next) => {
  console.log('two   before');
  await next();
  console.log('two   after')
}

const three = async (ctx, next) => {
  console.log('three before');
  await next();
  console.log('three after')
}

const sayHelloWithHooks = hooks(sayHello, [
  one,
  two,
  three
]);

(async () => {
  await sayHelloWithHooks('DAVID');
})();
```

Would print:

```console
one   before
two   before
three before
HELLO, DAVID!
three after
two   after
one   after
```

This order also applies when using hooks on [objects](#object-hooks) and [classes and with inheritance](#class-hooks).

### Regular Hooks

You may have noticed that after-hook execution order is the reverse compared to before-hook execution order.  This is due to how the hooks wrap around each other. If you prefer that the flow of the hooks matches the flow of the page, you can use Regular Hooks.  Regular Hooks are similar to Async Hooks, but they do not receive a `next` function as the second argument.  This means there is no `async next()` in the middle of the function body.  This allows the code execution to match the natural reading flow on the page: top to bottom.  Here's what a regular hook looks like:

```js
// A Regular Hook is just an async function that receives the context object.
const regularHook = async (context) => {
  // All code goes here.
}
```

With @feathersjs/hooks, the `collect` utility enables the use of Regular Hooks.

> Longtime FeathersJS developers will recognize Regular Hooks. They're the same type of hooks that have been around since the beginning.

#### The `collect` utility

The `collect` utility enables Regular Hooks functionality.  It gathers hooks into `before`, `after`, and `error` hooks.  Here's what it looks like.

```ts
import { hooks } from '@feathersjs/hooks'
import { discard } from 'feathers-hooks-common'

const make_request = () => { /* make a request to the database server */ }

const verify_auth = (context) => {
  /* Do auth verification, here */
}
const handle_error = (context) => {
  /* Do some error handling */
}

const request_with_middleware = hooks(
  make_request,
  middleware([
    collect({
      before: [verify_auth],
      after: [discard('password')],
      error: [handle_error]
    })
  ])
)
```

Or with a class:

```ts
import { hooks } from '@feathersjs/hooks'
import { discard } from 'feathers-hooks-common'

class DbAdapter {
  create() {
    /* create data in the db */
  }
}

const verify_auth = (context) => {
  /* Do auth verification, here */
}
const handle_error = (context) => {
  /* Do some error handling */
}

const request_with_middleware = hooks(
  DbAdapter,
  {
    create: middleware([
      collect({
        before: [verify_auth],
        after: [discard('password')],
        error: [handle_error]
      })
    ]),
  }
)
```

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
const { hooks } = require('@feathersjs/hooks');

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

# Contributing

For general contribution information refer to the [Feathers contribution guideLINES](https://github.com/feathersjs/hooks/blob/master/.github/contributing.md).

`@feathersjs/hooks` modules are written in TypeScript using [Deno](https://deno.land/) as the runtime. With Deno 1.16 or later installed you can start contributing by cloning this repository or your own fork via:

```
git clone git@github.com:feathersjs/hooks.git
cd hooks/
```

And then run the tests via:

```
make test
```

# License

Copyright (c) 2021

Licensed under the [MIT license](LICENSE).
