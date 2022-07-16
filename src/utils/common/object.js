export function clone (data) {
  return JSON.parse(JSON.stringify(data))
}

export function assign (target, ...sources) {
  sources.forEach(source => {
    const descriptors = Object.keys(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key)
      return descriptors
    }, {})
    Object.getOwnPropertySymbols(source).forEach(sym => {
      const descriptor = Object.getOwnPropertyDescriptor(source, sym)
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor
      }
    })
    Object.defineProperties(target, descriptors)
  })
  return target
}
