export default {
  schema: {},
  teethExist: new Set(),
  init () {},
  update () {},
  isExist (id) {
    return this.teethExist.has(id)
  },
  register (id) {
    if (id > 10 && id < 50) {
      this.teethExist.add(id)
    }
  }
}
