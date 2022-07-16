import * as gen from './gen'
import { Pipe } from './pipe'

export function pipe (generator) {
  return new Pipe(generator)
}

export function range (...args) {
  return pipe(gen.range(...args))
}

export function zip (...args) {
  return pipe(gen.zip(...args))
}

export function combine (...args) {
  return pipe(gen.combine(...args))
}

export function map (generator, func) {
  return pipe(generator).map(func)
}

export function forEach (generator, func) {
  return pipe(generator).forEach(func)
}

export function filter (generator, func) {
  return pipe(generator).filter(func)
}

export function find (generator, func) {
  return pipe(generator).find(func)
}
