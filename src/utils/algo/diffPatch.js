import { zip } from '@/utils/common'

export function buildTeethAttributePatch (old, current) {
  const count = old.count
  const patch = []
  for (let i = 0; i < count; i++) {
    if (old.getX(i) !== current.getX(i)) {
      patch.push([i, old.getX(i), current.getX(i)])
    }
  }
  return patch
}

export function buildAttributePatch (prev, current) {
  const modes = 'xyz'.split('').slice(0, prev.itemSize)
  return buildAttributePatchWithModes(prev, current, modes)
}

export function buildAttributePatchWithModes (prev, current, modes) {
  const patch = []
  for (let i = 0; i < prev.count; i++) {
    if (
      modes.some(
        m => getAttributeValue(prev, i, m) !== getAttributeValue(current, i, m)
      )
    ) {
      patch.push([
        i,
        modes.map(m => getAttributeValue(prev, i, m)),
        modes.map(m => getAttributeValue(current, i, m))
      ])
    }
  }
  return patch
}

export function getAttributeValue (attribute, index, mode = 'x') {
  switch (mode) {
    case 'x':
      return attribute.getX(index)
    case 'y':
      return attribute.getY(index)
    case 'z':
      return attribute.getZ(index)
  }
  throw new Error(`Unknown mode: ${mode}`)
}

export function setAttributeValue (attribute, index, value, mode = 'x') {
  switch (mode) {
    case 'x':
      return attribute.setX(index, value)
    case 'y':
      return attribute.setY(index, value)
    case 'z':
      return attribute.setZ(index, value)
  }
  throw new Error(`Unknown mode: ${mode}`)
}

export function setAttributeValues (attribute, index, values) {
  const modes = 'xyz'.split('').slice(0, attribute.itemSize)
  for (const [mode, value] of zip(modes, values)) {
    setAttributeValue(attribute, index, value, mode)
  }
}
