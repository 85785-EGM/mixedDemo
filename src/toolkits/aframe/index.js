import * as components from './components'
import * as geometries from './geometries'
import * as primitives from './primitives'
import * as shaders from './shaders'
import * as systems from './systems'
import { Toolkit } from './toolkit'

export const toolkit = new Toolkit({
  components,
  geometries,
  primitives,
  shaders,
  systems
})
