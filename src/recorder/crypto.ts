import crypto from 'crypto'

export function createGuid(): string {
  return crypto.randomBytes(16).toString('hex')
}
