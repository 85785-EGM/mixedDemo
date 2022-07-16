export function buildMeshesKey (...meshes) {
  const keys = []
  for (const mesh of meshes) {
    if (!mesh) continue
    if (mesh?.matrixWorld) {
      const matrixKey = mesh.matrixWorld.elements
        .map(x => x.toFixed(2))
        .join(',')
      keys.push(`${matrixKey}`)
    }
    if (mesh?.geometry) {
      keys.push(mesh.geometry.id)
      const positions = mesh.geometry.getAttribute('position')
      if (positions) {
        keys.push(positions.count, positions.version)
      }
    }
  }
  return keys.join(',')
}
export function buildMatrixKey (...matrixes) {
  return matrixes
    .filter(m => m?.isMatrix4)
    .map(m => m.elements)
    .flat()
    .map(x => x.toFixed(2))
    .join(',')
}
export function buildVectorKey (...vectors) {
  return vectors
    .filter(m => m?.isVector4 || m?.isVector3 || m?.isVector2)
    .map(m => m.toArray())
    .flat()
    .map(x => x.toFixed(2))
    .join(',')
}
export function buildGeometryKey (...geometries) {
  const keys = []
  for (const geometry of geometries) {
    if (!geometry) continue

    keys.push(geometry.id)
    const positions = geometry.getAttribute('position')
    if (positions) {
      keys.push(positions.count, positions.version)
    }
  }
  return keys.join(',')
}
