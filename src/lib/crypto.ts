import crypto from 'crypto'

// Use NEXTAUTH_SECRET as the base key and hash it to 32 bytes for aes-256-cbc compatibility
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'devhub-default-fallback-secret-key-32b'
const ENCRYPTION_KEY = crypto.createHash('sha256').update(NEXTAUTH_SECRET).digest()
const IV_LENGTH = 16 // 16 bytes for AES-256-CBC IV

/**
 * Encrypts a plain-text string using AES-256-CBC.
 * Returns the IV and the encrypted ciphertext joined by a colon.
 */
export function encrypt(text: string): string {
  if (!text) return ''
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a ciphertext string back into plain-text.
 * Expects the input to be in the "iv:ciphertext" format.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  const parts = encryptedText.split(':')
  const ivHex = parts.shift()
  const ciphertextHex = parts.join(':')

  if (!ivHex || !ciphertextHex) {
    throw new Error('Malformed encrypted text format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const encryptedBytes = Buffer.from(ciphertextHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encryptedBytes)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString('utf8')
}
