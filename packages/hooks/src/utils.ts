export function getOriginal (fn: any): any {
  return typeof fn.original === 'function' ? getOriginal(fn.original) : fn;
}

export function copyProperties <F> (target: F, original: any) {
  const originalProps = (Object.keys(original) as any)
    .concat(Object.getOwnPropertySymbols(original));

  for (const prop of originalProps) {
    const propDescriptor = Object.getOwnPropertyDescriptor(original, prop);

    if (!target.hasOwnProperty(prop)) {
      Object.defineProperty(target, prop, propDescriptor);
    }
  }

  return target;
}

const proto = Object.prototype as any;
// These are non-standard but offer a more reliable prototype based
// lookup for properties
const hasProtoDefinitions = typeof proto.__lookupGetter__ === 'function' &&
  typeof proto.__defineGetter__ === 'function' &&
  typeof proto.__defineSetter__ === 'function';

export function copyToSelf (target: any) {
  // tslint:disable-next-line
  for (const key in target) {
    if (!target.hasOwnProperty(key)) {
      const getter = hasProtoDefinitions ? target.constructor.prototype.__lookupGetter__(key)
        : Object.getOwnPropertyDescriptor(target, key);

      if (getter && hasProtoDefinitions) {
        target.__defineGetter__(key, getter);
        target.__defineSetter__(key, target.constructor.prototype.__lookupSetter__(key));
      } else if (getter) {
        Object.defineProperty(target, key, getter);
      } else {
        target[key] = target[key];
      }
    }
  }
}
