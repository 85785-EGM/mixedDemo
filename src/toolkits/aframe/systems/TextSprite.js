import {
  LinearFilter,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector2,
  Vector3,
  Matrix4,
  Triangle
} from 'three'

const _intersectPoint = new Vector3()
const _worldScale = new Vector3()
const _mvPosition = new Vector3()

const _alignedPosition = new Vector2()
const _rotatedPosition = new Vector2()
const _viewWorldMatrix = new Matrix4()

const _vA = new Vector3()
const _vB = new Vector3()
const _vC = new Vector3()

const _uvA = new Vector2()
const _uvB = new Vector2()
const _uvC = new Vector2()

function transformVertex (vertexPosition, mvPosition, center, scale, sin, cos) {
  // compute position in camera space
  _alignedPosition
    .subVectors(vertexPosition, center)
    .addScalar(0.5)
    .multiply(scale)

  // to check if rotation is not zero
  if (sin !== undefined) {
    _rotatedPosition.x = cos * _alignedPosition.x - sin * _alignedPosition.y
    _rotatedPosition.y = sin * _alignedPosition.x + cos * _alignedPosition.y
  } else {
    _rotatedPosition.copy(_alignedPosition)
  }

  vertexPosition.copy(mvPosition)
  vertexPosition.x += _rotatedPosition.x
  vertexPosition.y += _rotatedPosition.y

  // transform to world space
  vertexPosition.applyMatrix4(_viewWorldMatrix)
}

class TextSprite extends Sprite {
  constructor (text = '', textHeight = 10, color = 'rgba(255, 255, 255, 1)') {
    super(new SpriteMaterial({ map: new Texture() }))

    this._text = `${text}`
    this._textHeight = textHeight
    this._color = color
    this._backgroundColor = false // no background color

    this._padding = 0
    this._borderWidth = 0
    this._borderRadius = 0
    this._borderColor = 'white'

    this._strokeWidth = 0
    this._strokeColor = 'white'

    this._fontFace = 'Arial'
    this._fontSize = 90 // defines text resolution
    this._fontWeight = 'normal'

    this._canvas = document.createElement('canvas')
    this._texture = this.material.map
    this._texture.minFilter = LinearFilter

    this._genCanvas()
  }

  get text () {
    return this._text
  }

  set text (text) {
    this._text = text
    this._genCanvas()
  }

  get textHeight () {
    return this._textHeight
  }

  set textHeight (textHeight) {
    this._textHeight = textHeight
    this._genCanvas()
  }

  get color () {
    return this._color
  }

  set color (color) {
    this._color = color
    this._genCanvas()
  }

  get backgroundColor () {
    return this._backgroundColor
  }

  set backgroundColor (color) {
    this._backgroundColor = color
    this._genCanvas()
  }

  get padding () {
    return this._padding
  }

  set padding (padding) {
    this._padding = padding
    this._genCanvas()
  }

  get borderWidth () {
    return this._borderWidth
  }

  set borderWidth (borderWidth) {
    this._borderWidth = borderWidth
    this._genCanvas()
  }

  get borderRadius () {
    return this._borderRadius
  }

  set borderRadius (borderRadius) {
    this._borderRadius = borderRadius
    this._genCanvas()
  }

  get borderColor () {
    return this._borderColor
  }

  set borderColor (borderColor) {
    this._borderColor = borderColor
    this._genCanvas()
  }

  get fontFace () {
    return this._fontFace
  }

  set fontFace (fontFace) {
    this._fontFace = fontFace
    this._genCanvas()
  }

  get fontSize () {
    return this._fontSize
  }

  set fontSize (fontSize) {
    this._fontSize = fontSize
    this._genCanvas()
  }

  get fontWeight () {
    return this._fontWeight
  }

  set fontWeight (fontWeight) {
    this._fontWeight = fontWeight
    this._genCanvas()
  }

  get strokeWidth () {
    return this._strokeWidth
  }

  set strokeWidth (strokeWidth) {
    this._strokeWidth = strokeWidth
    this._genCanvas()
  }

  get strokeColor () {
    return this._strokeColor
  }

  set strokeColor (strokeColor) {
    this._strokeColor = strokeColor
    this._genCanvas()
  }

  _genCanvas () {
    const canvas = this._canvas
    const ctx = canvas.getContext('2d')

    const border = Array.isArray(this.borderWidth)
      ? this.borderWidth
      : [this.borderWidth, this.borderWidth] // x,y border
    const relBorder = border.map(b => b * this.fontSize * 0.1) // border in canvas units

    const borderRadius = Array.isArray(this.borderRadius)
      ? this.borderRadius
      : [
          this.borderRadius,
          this.borderRadius,
          this.borderRadius,
          this.borderRadius
        ] // tl tr br bl corners
    const relBorderRadius = borderRadius.map(b => b * this.fontSize * 0.1) // border radius in canvas units

    const padding = Array.isArray(this.padding)
      ? this.padding
      : [this.padding, this.padding] // x,y padding
    const relPadding = padding.map(p => p * this.fontSize * 0.1) // padding in canvas units

    const lines = this.text.split('\n')
    const font = `${this.fontWeight} ${this.fontSize}px ${this.fontFace}`

    ctx.font = font // measure canvas with appropriate font
    const innerWidth = Math.max(
      ...lines.map(line => ctx.measureText(line).width)
    )
    const innerHeight = this.fontSize * lines.length
    canvas.width = innerWidth + relBorder[0] * 2 + relPadding[0] * 2
    canvas.height = innerHeight + relBorder[1] * 2 + relPadding[1] * 2

    // paint border
    if (this.borderWidth) {
      ctx.strokeStyle = this.borderColor

      if (relBorder[0]) {
        // left + right borders
        const hb = relBorder[0] / 2
        ctx.lineWidth = relBorder[0]
        ctx.beginPath()
        ctx.moveTo(hb, relBorderRadius[0])
        ctx.lineTo(hb, canvas.height - relBorderRadius[3])
        ctx.moveTo(canvas.width - hb, relBorderRadius[1])
        ctx.lineTo(canvas.width - hb, canvas.height - relBorderRadius[2])
        ctx.stroke()
      }

      if (relBorder[1]) {
        // top + bottom borders
        const hb = relBorder[1] / 2
        ctx.lineWidth = relBorder[1]
        ctx.beginPath()
        ctx.moveTo(Math.max(relBorder[0], relBorderRadius[0]), hb)
        ctx.lineTo(
          canvas.width - Math.max(relBorder[0], relBorderRadius[1]),
          hb
        )
        ctx.moveTo(
          Math.max(relBorder[0], relBorderRadius[3]),
          canvas.height - hb
        )
        ctx.lineTo(
          canvas.width - Math.max(relBorder[0], relBorderRadius[2]),
          canvas.height - hb
        )
        ctx.stroke()
      }

      if (this.borderRadius) {
        // strike rounded corners
        const cornerWidth = Math.max(...relBorder)
        const hb = cornerWidth / 2
        ctx.lineWidth = cornerWidth
        ctx.beginPath()
        ;[
          !!relBorderRadius[0] && [
            relBorderRadius[0],
            hb,
            hb,
            relBorderRadius[0]
          ],
          !!relBorderRadius[1] && [
            canvas.width - relBorderRadius[1],
            canvas.width - hb,
            hb,
            relBorderRadius[1]
          ],
          !!relBorderRadius[2] && [
            canvas.width - relBorderRadius[2],
            canvas.width - hb,
            canvas.height - hb,
            canvas.height - relBorderRadius[2]
          ],
          !!relBorderRadius[3] && [
            relBorderRadius[3],
            hb,
            canvas.height - hb,
            canvas.height - relBorderRadius[3]
          ]
        ]
          .filter(d => d)
          .forEach(([x0, x1, y0, y1]) => {
            ctx.moveTo(x0, y0)
            ctx.quadraticCurveTo(x1, y0, x1, y1)
          })
        ctx.stroke()
      }
    }

    // paint background
    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor
      if (!this.borderRadius) {
        ctx.fillRect(
          relBorder[0],
          relBorder[1],
          canvas.width - relBorder[0] * 2,
          canvas.height - relBorder[1] * 2
        )
      } else {
        // fill with rounded corners
        ctx.beginPath()
        ctx.moveTo(relBorder[0], relBorderRadius[0])
        ;[
          [
            relBorder[0],
            relBorderRadius[0],
            canvas.width - relBorderRadius[1],
            relBorder[1],
            relBorder[1],
            relBorder[1]
          ], // t
          [
            canvas.width - relBorder[0],
            canvas.width - relBorder[0],
            canvas.width - relBorder[0],
            relBorder[1],
            relBorderRadius[1],
            canvas.height - relBorderRadius[2]
          ], // r
          [
            canvas.width - relBorder[0],
            canvas.width - relBorderRadius[2],
            relBorderRadius[3],
            canvas.height - relBorder[1],
            canvas.height - relBorder[1],
            canvas.height - relBorder[1]
          ], // b
          [
            relBorder[0],
            relBorder[0],
            relBorder[0],
            canvas.height - relBorder[1],
            canvas.height - relBorderRadius[3],
            relBorderRadius[0]
          ] // t
        ].forEach(([x0, x1, x2, y0, y1, y2]) => {
          ctx.quadraticCurveTo(x0, y0, x1, y1)
          ctx.lineTo(x2, y2)
        })
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.translate(...relBorder)
    ctx.translate(...relPadding)

    // paint text
    ctx.font = font // Set font again after canvas is resized, as context properties are reset
    ctx.fillStyle = this.color
    ctx.textBaseline = 'bottom'

    const drawTextStroke = this.strokeWidth > 0
    if (drawTextStroke) {
      ctx.lineWidth = (this.strokeWidth * this.fontSize) / 10
      ctx.strokeStyle = this.strokeColor
    }

    lines.forEach((line, index) => {
      const lineX = (innerWidth - ctx.measureText(line).width) / 2
      const lineY = (index + 1) * this.fontSize

      drawTextStroke && ctx.strokeText(line, lineX, lineY)
      ctx.fillText(line, lineX, lineY)
    })

    // Inject canvas into sprite
    this._texture.image = canvas
    this._texture.needsUpdate = true

    const yScale =
      this.textHeight * lines.length + border[1] * 2 + padding[1] * 2
    this.scale.set((yScale * canvas.width) / canvas.height, yScale, 0)
  }

  clone () {
    return new this.constructor(this.text, this.textHeight, this.color).copy(
      this
    )
  }

  raycast (raycaster, intersects) {
    if (raycaster.camera === null) {
      console.error(
        'THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'
      )
    }

    _worldScale.setFromMatrixScale(this.matrixWorld)

    _viewWorldMatrix.copy(raycaster.camera.matrixWorld)
    this.modelViewMatrix.multiplyMatrices(
      raycaster.camera.matrixWorldInverse,
      this.matrixWorld
    )

    _mvPosition.setFromMatrixPosition(this.modelViewMatrix)

    if (
      raycaster.camera.isPerspectiveCamera &&
      this.material.sizeAttenuation === false
    ) {
      _worldScale.multiplyScalar(-_mvPosition.z)
    }

    const rotation = this.material.rotation
    let sin, cos

    if (rotation !== 0) {
      cos = Math.cos(rotation)
      sin = Math.sin(rotation)
    }

    const center = this.center

    transformVertex(
      _vA.set(-0.5, -0.5, 0),
      _mvPosition,
      center,
      _worldScale,
      sin,
      cos
    )
    transformVertex(
      _vB.set(0.5, -0.5, 0),
      _mvPosition,
      center,
      _worldScale,
      sin,
      cos
    )
    transformVertex(
      _vC.set(0.5, 0.5, 0),
      _mvPosition,
      center,
      _worldScale,
      sin,
      cos
    )

    _uvA.set(0, 0)
    _uvB.set(1, 0)
    _uvC.set(1, 1)

    // check first triangle
    let intersect = raycaster.ray.intersectTriangle(
      _vA,
      _vB,
      _vC,
      false,
      _intersectPoint
    )

    if (intersect === null) {
      // check second triangle
      transformVertex(
        _vB.set(-0.5, 0.5, 0),
        _mvPosition,
        center,
        _worldScale,
        sin,
        cos
      )
      _uvB.set(0, 1)

      intersect = raycaster.ray.intersectTriangle(
        _vA,
        _vC,
        _vB,
        false,
        _intersectPoint
      )
      if (intersect === null) {
        return
      }
    }

    const distance = raycaster.ray.origin.distanceTo(_intersectPoint)

    if (distance < raycaster.near || distance > raycaster.far) return

    intersects.push({
      distance: distance,
      point: _intersectPoint.clone(),
      uv: Triangle.getUV(
        _intersectPoint,
        _vA,
        _vB,
        _vC,
        _uvA,
        _uvB,
        _uvC,
        new Vector2()
      ),
      face: null,
      object: this
    })
  }

  copy (source) {
    Sprite.prototype.copy.call(this, source)

    this.color = source.color
    this.backgroundColor = source.backgroundColor
    this.padding = source.padding
    this.borderWidth = source.borderWidth
    this.borderColor = source.borderColor
    this.fontFace = source.fontFace
    this.fontSize = source.fontSize
    this.fontWeight = source.fontWeight
    this.strokeWidth = source.strokeWidth
    this.strokeColor = source.strokeColor

    return this
  }
}

export default {
  init () {},
  build (text, textHeight, layer = 0) {
    const _text = text ?? ''
    const _textHeight = textHeight ?? 8
    const label = new TextSprite(_text, _textHeight)
    if (layer > 0) {
      label.renderOrder = layer
      label.material.depthWrite = false
      label.material.depthTest = false
    }
    return label
  }
}
