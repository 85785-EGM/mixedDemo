export function mixin (...args) {
  const dependencies = args.map(arg => arg.dependencies ?? []).flat()
  const schema = Object.assign({}, ...args.map(arg => arg.schema))
  return Object.assign({}, ...args, { dependencies, schema })
}

export function scalarOffset (start, end, offset) {
  return end
    .clone()
    .sub(start)
    .normalize()
    .multiplyScalar(offset)
}

export function parse (data) {
  if (Array.isArray(data)) {
    return data.map(parse).join(',')
  }
  if (data?.isVector3) {
    return vec3(...data.toArray())
  }
  if (typeof data === 'object' && data !== null) {
    return (
      Object.entries(data)
        // eslint-disable-next-line no-unused-vars
        .filter(([_, value]) => ![null, undefined].includes(value))
        .map(([key, value]) => {
          return `${key}: ${parse(value)}`
        })
        .join('; ')
        .concat(';')
    )
  }
  return data.toString()
}

export function selector (id) {
  return `#${id}`
}

export function id (id) {
  return `#${id}`
}

export function vec3 (...args) {
  return args.join(' ')
}
