import libtess from 'libtess'
import { Line3, Vector3 } from 'three'
import { fixVector3 } from './geometry'

const tessy = (function initTesselator () {
  // function called for each vertex of tesselator output
  function vertexCallback (data, polyVertArray) {
    polyVertArray[polyVertArray.length] = data[0]
    polyVertArray[polyVertArray.length] = data[1]
  }
  function begincallback (type) {
    if (type !== libtess.primitiveType.GL_TRIANGLES) {
      console.debug('expected TRIANGLES but got type: ' + type)
    }
  }
  function errorcallback (errno) {
    console.debug('error callback')
    console.debug('error number: ' + errno)
  }
  // callback for when segments intersect and must be split
  function combinecallback (coords, data, weight) {
    return [coords[0], coords[1], coords[2]]
  }
  function edgeCallback (flag) {
    // don't really care about the flag, but need no-strip/no-fan behavior
  }

  const tessy = new libtess.GluTesselator()
  // tessy.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_POSITIVE);
  tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback)
  tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback)
  tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback)
  tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback)
  tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback)

  return tessy
})()

function triangulate (contours) {
  // libtess will take 3d verts and flatten to a plane for tesselation
  // since only doing 2d tesselation here, provide z=1 normal to skip
  // iterating over verts only to get the same answer.
  // comment out to test normal-generation code
  // tessy.gluTessNormal(0, 0, 1)

  const triangleVerts = []
  tessy.gluTessBeginPolygon(triangleVerts)

  for (let i = 0; i < contours.length; i++) {
    tessy.gluTessBeginContour()
    const contour = contours[i]
    for (let j = 0; j < contour.length; j += 2) {
      const coords = [contour[j], contour[j + 1], 0]
      tessy.gluTessVertex(coords, coords)
    }
    tessy.gluTessEndContour()
  }

  tessy.gluTessEndPolygon()

  return triangleVerts
}
const getInjectType = (l0, l1) => {
  const result = [
    l0.start.equals(l1.end),
    l0.end.equals(l1.start),
    l0.start.equals(l1.start),
    l0.end.equals(l1.end)
  ]
  return {
    injectBeforeWithoutReverse: result[0],
    injectAfterWithoutReverse: result[1],
    injectBeforeWithReverse: result[2],
    injectAfterWithReverse: result[3],
    notInject: !result.includes(true)
  }
}
function mergedLines (lines, digit) {
  return lines.map(
    l =>
      new Line3(
        fixVector3(l.start, digit, new Vector3()),
        fixVector3(l.end, digit, new Vector3())
      )
  )
}
function buildLinesGroups (inputLinesGroups = [], buildPointKey) {
  const linesGroups = []
  for (const lines of inputLinesGroups) {
    const keys = lines
      .map(l => [buildPointKey(l.start), buildPointKey(l.end)])
      .reduce((prev, cur) => {
        prev.add(cur[0])
        prev.add(cur[1])
        return prev
      }, new Set())
    const keysArray = [...keys]
    const group = linesGroups.find(g =>
      keysArray.find(key => g.points.has(key))
    )
    if (group) {
      // group.points.add(...keys)
      keys.forEach(key => group.points.add(key))
      group.lines.push(...lines)
    } else {
      linesGroups.push({ points: keys, lines: lines })
    }
  }
  return linesGroups.map(g => [...new Set(g.lines)])
}

function getConnectedLines (linesSorted = [], digit = 4) {
  const pointLinesMap = new Map() // key is point , value is lines shares that point
  const buildPointKey = p => [p.x, p.y].map(n => n.toFixed(digit)).join(',')
  linesSorted.forEach((line, i) => {
    line.index = i
    line.startKey = buildPointKey(line.start)
    line.endKey = buildPointKey(line.end)
  })
  for (const line of linesSorted) {
    const keys = ['start', 'end'].map(pos => buildPointKey(line[pos]))
    if (keys[0] === keys[1]) continue
    for (const key of keys) {
      if (pointLinesMap.has(key)) {
        pointLinesMap.get(key).push(line)
      } else {
        pointLinesMap.set(key, [line])
      }
    }
  }
  const errorParts = [...pointLinesMap.values()].filter(
    lines => ![1, 2].includes(lines.length)
  )
  errorParts.forEach(lines => {
    lines.forEach(l => (l.error = true))
  })
  // console.assert(errorParts.length === 0)
  let needMerge = true
  let watchDog = 30
  const linesGroups = [...pointLinesMap.values()]
  while (needMerge) {
    watchDog--
    const tempLinesGroups = buildLinesGroups(linesGroups, buildPointKey)
    if (tempLinesGroups.length === linesGroups.length) {
      needMerge = false
    }
    linesGroups.length = 0
    linesGroups.push(...tempLinesGroups)
    if (watchDog === 0) {
      console.error('watch dog calls')
      needMerge = false
    }
  }

  linesGroups.forEach(linesGroup =>
    linesGroup.forEach(line => {
      const startLines = linesGroup.filter(
        l => l !== line && [l.startKey, l.endKey].includes(line.startKey)
      )
      const endLines = linesGroup.filter(
        l => l !== line && [l.startKey, l.endKey].includes(line.endKey)
      )
      // console.assert(startLines.length <= 1, startLines)
      // console.assert(endLines.length <= 1, endLines)
      line.startLine = startLines.pop() ?? null
      line.endLine = endLines.pop() ?? null
    })
  )

  function fillNextContours (
    contour = [],
    contourLines = [],
    firstLine = new Line3(),
    _nextLineKey = 'startLine'
  ) {
    let currentLine = firstLine
    let nextLineKey = _nextLineKey
    let nextLine = currentLine[nextLineKey]

    while (nextLine) {
      if (contourLines.includes(nextLine)) {
        break
      }
      contourLines.push(nextLine)
      if (nextLineKey === 'startLine') {
        contour.push(currentLine.start)
      } else {
        contour.push(currentLine.end)
      }
      if (!nextLine.startLine || !nextLine.endLine) {
        break
      }
      if (nextLine.startLine === currentLine) {
        nextLineKey = 'endLine'
      } else if (nextLine.endLine === currentLine) {
        nextLineKey = 'startLine'
      }
      currentLine = nextLine
      nextLine = currentLine[nextLineKey]
    }
  }
  const contours = linesGroups.map(linesGroup => {
    const firstLine = linesGroup.find(l => l.startLine && l.endLine)
    const contourLines = [firstLine]
    const contourFromStart = []
    const contourFromEnd = []
    fillNextContours(contourFromStart, contourLines, firstLine, 'startLine')
    fillNextContours(contourFromEnd, contourLines, firstLine, 'endLine')
    return [...contourFromEnd.reverse(), ...contourFromStart]
  })
  return contours
}
function needReverse (lines0, lines1) {
  if (lines0.length > 0 && lines1.length > 0) {
    const lines0Start = lines0[0]
    const lines1Start = lines1[0]
    const lines0End = lines0[lines0.length - 1]
    const lines1End = lines1[lines1.length - 1]
    const s0s1 = lines0Start.distanceTo(lines1Start)
    const e0e1 = lines0End.distanceTo(lines1End)
    const s0e1 = lines0Start.distanceTo(lines1End)
    const e0s1 = lines0End.distanceTo(lines1Start)
    if (s0s1 + e0e1 < s0e1 + e0s1) {
      return true
    }
  }
}
function getContourFromLines (lines = [], digit = 4) {
  if (lines.length === 0) return []
  const linesMerged = mergedLines(lines, digit)
  const contours = getConnectedLines(linesMerged, digit) // .map(l => l.clone())
  if (contours.length > 2) {
    console.error('contours.length>2', contours)
  }
  if (contours.length >= 2) {
    if (needReverse(contours[0], contours[1])) {
      contours[1].reverse()
    }
    return [...contours[0], ...contours[1]]
  }
  if (contours.length === 1) {
    return contours[0]
  }
  if (contours.length === 0) {
    return []
  }
}

export { triangulate, getContourFromLines }
