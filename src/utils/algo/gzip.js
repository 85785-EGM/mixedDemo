import * as fflate from 'fflate'
import greenlet from '@/utils/greenlet'

export const encodeSync = fflate.compressSync
export const decodeSync = fflate.decompressSync
export const encode = greenlet(async (...args) => {
  return fflate.compressSync(...args)
}).bind(fflate)
export const decode = greenlet(async (...args) => {
  fflate.decompressSync(...args)
}).bind(fflate)
