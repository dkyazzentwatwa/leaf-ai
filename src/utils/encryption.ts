/**
 * Client-Side Encryption Utilities
 *
 * End-to-end encryption at rest using Web Crypto API.
 * 100% local - no key servers, no external calls.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * @module encryption
 */

const ENCRYPTION_KEY_NAME = 'leaf-ai-encryption-key'
const SALT_KEY_NAME = 'leaf-ai-salt'
const ITERATIONS = 100000 // PBKDF2 iterations for key derivation

export interface EncryptionResult {
  ciphertext: string
  iv: string
}

/**
 * Generate or retrieve encryption key from password
 * Uses PBKDF2 for key derivation with 100,000 iterations
 *
 * @param password - User's password
 * @returns CryptoKey for encryption/decryption
 */
async function getOrCreateKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()

  // Get or create salt
  let salt = localStorage.getItem(SALT_KEY_NAME)
  if (!salt) {
    const saltArray = crypto.getRandomValues(new Uint8Array(16))
    salt = btoa(String.fromCharCode(...saltArray))
    localStorage.setItem(SALT_KEY_NAME, salt)
  }

  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0))

  // Derive key from password using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt string data using AES-256-GCM
 *
 * @param data - Plain text string to encrypt
 * @param password - User's password for encryption
 * @returns Encrypted data with IV
 *
 * @example
 * ```typescript
 * const encrypted = await encrypt('secret message', 'my-password')
 * console.log(encrypted.ciphertext, encrypted.iv)
 * ```
 */
export async function encrypt(data: string, password: string): Promise<EncryptionResult> {
  if (!data || typeof data !== 'string') {
    throw new Error('Data must be a non-empty string')
  }

  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }

  const encoder = new TextEncoder()
  const key = await getOrCreateKey(password)

  // Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  // Return base64-encoded ciphertext and IV
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

/**
 * Decrypt string data using AES-256-GCM
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param password - User's password for decryption
 * @returns Decrypted plain text string
 * @throws Error if decryption fails (wrong password or corrupted data)
 *
 * @example
 * ```typescript
 * try {
 *   const decrypted = await decrypt(ciphertext, iv, 'my-password')
 *   console.log(decrypted)
 * } catch (error) {
 *   console.error('Decryption failed:', error)
 * }
 * ```
 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  password: string
): Promise<string> {
  if (!ciphertext || !iv || !password) {
    throw new Error('Ciphertext, IV, and password are required')
  }

  const decoder = new TextDecoder()
  const key = await getOrCreateKey(password)

  // Decode base64 to binary
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0))

  try {
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      ciphertextBuffer
    )

    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error('Decryption failed - incorrect password or corrupted data')
  }
}

/**
 * Encrypt a JSON object
 * Convenience wrapper for encrypting structured data
 *
 * @param obj - JavaScript object to encrypt
 * @param password - User's password
 * @returns Encrypted data with IV
 *
 * @example
 * ```typescript
 * const encrypted = await encryptObject({ user: 'john', messages: [...] }, 'password')
 * ```
 */
export async function encryptObject(obj: any, password: string): Promise<EncryptionResult> {
  const json = JSON.stringify(obj)
  return encrypt(json, password)
}

/**
 * Decrypt to a JSON object
 * Convenience wrapper for decrypting structured data
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param password - User's password
 * @returns Decrypted JavaScript object
 *
 * @example
 * ```typescript
 * const obj = await decryptObject(ciphertext, iv, 'password')
 * console.log(obj.user, obj.messages)
 * ```
 */
export async function decryptObject(
  ciphertext: string,
  iv: string,
  password: string
): Promise<any> {
  const json = await decrypt(ciphertext, iv, password)
  return JSON.parse(json)
}

/**
 * Clear all encryption keys (for logout/reset)
 * Removes salt and key material from localStorage
 *
 * @example
 * ```typescript
 * clearEncryptionKeys() // User logged out
 * ```
 */
export function clearEncryptionKeys(): void {
  localStorage.removeItem(SALT_KEY_NAME)
  localStorage.removeItem(ENCRYPTION_KEY_NAME)
}

/**
 * Check if Web Crypto API is available
 * Use this to verify encryption support before enabling features
 *
 * @returns true if encryption is available, false otherwise
 *
 * @example
 * ```typescript
 * if (isEncryptionAvailable()) {
 *   // Show encryption options
 * } else {
 *   // Show warning or disable encryption
 * }
 * ```
 */
export function isEncryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function'
}

/**
 * Validate password strength
 * Returns feedback on password security
 *
 * @param password - Password to validate
 * @returns Strength score (0-4) and feedback message
 *
 * @example
 * ```typescript
 * const { score, feedback } = validatePasswordStrength('mypassword')
 * if (score < 2) {
 *   alert(feedback)
 * }
 * ```
 */
export function validatePasswordStrength(password: string): {
  score: number // 0-4: weak to very strong
  feedback: string
} {
  if (!password) {
    return { score: 0, feedback: 'Password is required' }
  }

  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  if (password.length < 8) {
    feedback.push('Use at least 8 characters')
  }

  // Complexity checks
  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Add special characters')

  // Cap score at 4
  score = Math.min(score, 4)

  // Generate feedback message
  let message = ''
  if (score === 0) message = 'Very weak - ' + feedback.join(', ')
  else if (score === 1) message = 'Weak - ' + feedback.join(', ')
  else if (score === 2) message = 'Fair - Consider ' + feedback.join(' and ')
  else if (score === 3) message = 'Good password'
  else message = 'Strong password'

  return { score, feedback: message }
}

/**
 * Test if password is correct by attempting to decrypt test data
 * Used for password verification without storing the password
 *
 * @param password - Password to test
 * @param testCiphertext - Encrypted test data
 * @param testIv - IV for test data
 * @returns true if password is correct, false otherwise
 */
export async function testPassword(
  password: string,
  testCiphertext: string,
  testIv: string
): Promise<boolean> {
  try {
    await decrypt(testCiphertext, testIv, password)
    return true
  } catch {
    return false
  }
}
