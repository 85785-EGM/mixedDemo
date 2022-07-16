import { trampoline } from '@/utils/common'
import { getFacetFromPoint } from '@/utils/structs/mesh'

async function _spreadPoint ({
  positions,
  kdtree,
  point,
  func,
  condition,
  samePointsSearchCount = 30
}) {
  const nextLoop = []
  if (!(await condition(point))) {
    return nextLoop
  }

  const samePoints = kdtree
    .nearest(point, samePointsSearchCount)
    // eslint-disable-next-line no-unused-vars
    .filter(([_, d]) => d === 0)
    .map(([p]) => p)

  for (const p of samePoints) {
    await func(p)
  }

  for (const p of samePoints) {
    const f = getFacetFromPoint(positions, p)
    for (const fp of f.points) {
      if (!(await condition(fp))) continue
      nextLoop.push(
        _spreadPoint.bind(null, {
          positions,
          kdtree,
          point: fp,
          func,
          condition,
          samePointsSearchCount
        })
      )
    }
  }
  return nextLoop
}

async function _spreadFacet ({
  positions,
  kdtree,
  face,
  func,
  condition,
  samePointsSearchCount = 30
}) {
  const nextLoop = []
  if (!(await condition(face))) {
    return nextLoop
  }

  await func(face)

  for (const point of face.points) {
    const samePoints = kdtree
      .nearest(point, samePointsSearchCount)
      // eslint-disable-next-line no-unused-vars
      .filter(([_, d]) => d === 0)
      .map(([p]) => p)

    for (const p of samePoints) {
      const f = getFacetFromPoint(positions, p)
      if (!(await condition(f))) continue
      nextLoop.push(
        _spreadFacet.bind(null, {
          positions,
          kdtree,
          face: f,
          func,
          condition,
          samePointsSearchCount
        })
      )
    }
  }
  return nextLoop
}

export const spreadPoint = async (...args) =>
  trampoline(_spreadPoint.bind(null, ...args), {})
export const spreadFacet = async (...args) =>
  trampoline(_spreadFacet.bind(null, ...args), {})
