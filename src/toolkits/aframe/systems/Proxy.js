import config from '@/config'

const defaultURL = 'http://localhost:5555/'

export default {
  schema: {
    static: { default: config?.proxy?.static ?? defaultURL, type: 'string' }
  },
  init () {
    console.debug('proxy static', this.data.static)
  },
  update () {
    this.url = new URL(this.data.static)
  },
  getStatic (address = '') {
    if (address.startsWith('http://') || address.startsWith('https://')) {
      return address
    }
    return this.url.toString() + address
  }
}
