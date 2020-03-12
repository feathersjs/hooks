const { hooks, withParams } = require('./lib')

const getRuntime = async callback => {
  const start = Date.now();

  for (let i = 0; i < 100000; i++) {
    await callback();
  }

  return Date.now() - start;
}
const hello = async (name, _params) => {
  return `Hello ${name}`;
};

const hookHello1 = hooks(hello, []);
const hookHello2 = hooks(hello, [
  async (_ctx, next) => {
    await next();
  }
]);
const hookHello3 = hooks(hello, {
  middleware: [
    async (_ctx, next) => {
      await next();
    }
  ],
  context: [withParams('name')]
});
const hookHello4 = hooks(hello, {
  middleware: [
    async (_ctx, next) => {
      await next();
    }
  ],
  context: [withParams(), withParams('name'), withParams()]
});
const hookHello5 = hooks(hello, {
  middleware: [
    async (_ctx, next) => {
      await next();
    }
  ],
  context: [withParams(), withParams(), withParams()]
});

(async () => {
  console.log('Baseline', await getRuntime(() => hello('Dave')));

  console.log('Empty hooks', await getRuntime(() => hookHello1('Dave')));
  console.log('Single simple hook', await getRuntime(() => hookHello2('Dave')));
  console.log('Single hook and withParams', await getRuntime(() => hookHello3('Dave')));
  console.log('Single hook, multiple withParams', await getRuntime(() => hookHello4('Dave')));
  console.log('Single hook, multiple withParams (no named)', await getRuntime(() => hookHello5('Dave')));
})()
