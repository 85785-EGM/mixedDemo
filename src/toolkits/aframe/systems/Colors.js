function getTeethColor (id) {
  return '#ddd'
  // if (id > 10 && id < 50) {
  //   return `#${(Math.floor(id / 10) * 256 + (id % 10) * 16).toString(16)}`
  // }
}
export default {
  schema: {
    clear: { type: 'color', default: '#fff' }
  },
  init () {},
  update () {},
  getToothColor (toothID) {
    return getTeethColor(toothID) ?? this.data.clear
  }
}
