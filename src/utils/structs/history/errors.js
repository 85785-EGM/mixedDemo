export class CommitNotImplementedError extends Error {
  constructor (name) {
    super(`Commit Not Implemented: ${name}`)
  }
}
