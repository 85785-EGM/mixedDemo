export class Toolkits {
  constructor (...toolkits) {
    this.toolkits = toolkits
  }

  install (app) {
    this.toolkits.map(toolkit => toolkit.install(app))
  }
}
