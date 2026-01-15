/**
 * Security Test Suite
 *
 * Comprehensive tests for security features including XSS protection,
 * file validation, encryption, input sanitization, and worker validation.
 */

import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeText, isUrlSafe, containsDangerousContent } from '@/utils/sanitize'
import { sanitizeFileName, validateContentSize } from '@/utils/fileValidation'
import { encrypt, decrypt, validatePasswordStrength, isEncryptionAvailable } from '@/utils/encryption'
import { validateWorkerRequest, validateWorkerResponse, isValidModelId } from '@/features/ai/workers/validation'

describe('Security: XSS Protection', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const dirty = '<script>alert("xss")</script>Hello'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).not.toContain('alert')
    })

    it('should block javascript: URLs', () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('javascript:')
    })

    it('should block data: URLs', () => {
      const dirty = '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('data:')
    })

    it('should remove event handlers', () => {
      const dirty = '<img src=x onerror=alert(1)>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('onerror')
      expect(clean).not.toContain('alert')
    })

    it('should preserve safe HTML', () => {
      const safe = '<p>Hello <strong>world</strong></p>'
      const clean = sanitizeHtml(safe)
      expect(clean).toContain('<p>')
      expect(clean).toContain('<strong>')
      expect(clean).toContain('Hello')
      expect(clean).toContain('world')
    })

    it('should allow safe links with https', () => {
      const safe = '<a href="https://example.com">Link</a>'
      const clean = sanitizeHtml(safe)
      expect(clean).toContain('https://example.com')
      expect(clean).toContain('Link')
    })

    it('should handle nested tags', () => {
      const dirty = '<div><script>alert(1)</script><p>Safe</p></div>'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('<p>')
      expect(clean).toContain('Safe')
    })
  })

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const text = '<script>alert("xss")</script>'
      const sanitized = sanitizeText(text)
      expect(sanitized).toContain('&lt;')
      expect(sanitized).toContain('&gt;')
      expect(sanitized).not.toContain('<script>')
    })
  })

  describe('isUrlSafe', () => {
    it('should allow https URLs', () => {
      expect(isUrlSafe('https://example.com')).toBe(true)
    })

    it('should allow http URLs', () => {
      expect(isUrlSafe('http://example.com')).toBe(true)
    })

    it('should allow mailto URLs', () => {
      expect(isUrlSafe('mailto:test@example.com')).toBe(true)
    })

    it('should block javascript URLs', () => {
      expect(isUrlSafe('javascript:alert(1)')).toBe(false)
    })

    it('should block data URLs', () => {
      expect(isUrlSafe('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should block vbscript URLs', () => {
      expect(isUrlSafe('vbscript:alert(1)')).toBe(false)
    })
  })

  describe('containsDangerousContent', () => {
    it('should detect script tags', () => {
      expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true)
    })

    it('should detect javascript: protocol', () => {
      expect(containsDangerousContent('javascript:alert(1)')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(containsDangerousContent('<img onerror=alert(1)>')).toBe(true)
    })

    it('should not flag safe content', () => {
      expect(containsDangerousContent('Hello world')).toBe(false)
    })
  })
})

describe('Security: File Validation', () => {
  describe('sanitizeFileName', () => {
    it('should remove path traversal attempts', () => {
      const name = '../../etc/passwd'
      const sanitized = sanitizeFileName(name)
      expect(sanitized).not.toContain('..')
      expect(sanitized).not.toContain('/')
    })

    it('should remove dangerous characters', () => {
      const name = 'file<script>.txt'
      const sanitized = sanitizeFileName(name)
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('should limit length', () => {
      const name = 'a'.repeat(300)
      const sanitized = sanitizeFileName(name, 50)
      expect(sanitized.length).toBeLessThanOrEqual(50)
    })

    it('should return fallback for empty input', () => {
      const sanitized = sanitizeFileName('')
      expect(sanitized).toBe('unnamed-file')
    })
  })

  describe('validateContentSize', () => {
    it('should reject oversized content', () => {
      const content = 'a'.repeat(15000)
      const result = validateContentSize(content)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should accept valid content', () => {
      const content = 'Hello world'
      const result = validateContentSize(content)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Security: Encryption', () => {
  describe('validatePasswordStrength', () => {
    it('should reject empty password', () => {
      const result = validatePasswordStrength('')
      expect(result.score).toBe(0)
      expect(result.feedback).toContain('required')
    })

    it('should score weak passwords low', () => {
      const result = validatePasswordStrength('12345')
      expect(result.score).toBeLessThan(2)
    })

    it('should score strong passwords high', () => {
      const result = validatePasswordStrength('MyStr0ng!Pass2024')
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should provide feedback for weak passwords', () => {
      const result = validatePasswordStrength('abc')
      expect(result.feedback).toBeTruthy()
      expect(result.feedback.length).toBeGreaterThan(0)
    })
  })

  describe('isEncryptionAvailable', () => {
    it('should check for Web Crypto API', () => {
      const available = isEncryptionAvailable()
      expect(typeof available).toBe('boolean')
    })
  })

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt successfully', async () => {
      const data = 'Secret message'
      const password = 'MySecurePassword123!'

      const encrypted = await encrypt(data, password)
      expect(encrypted.ciphertext).toBeTruthy()
      expect(encrypted.iv).toBeTruthy()
      expect(encrypted.ciphertext).not.toBe(data)

      const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, password)
      expect(decrypted).toBe(data)
    })

    it('should fail with wrong password', async () => {
      const data = 'Secret message'
      const password = 'MySecurePassword123!'
      const wrongPassword = 'WrongPassword456!'

      const encrypted = await encrypt(data, password)

      await expect(
        decrypt(encrypted.ciphertext, encrypted.iv, wrongPassword)
      ).rejects.toThrow()
    })

    it('should reject empty data', async () => {
      await expect(encrypt('', 'password')).rejects.toThrow()
    })

    it('should reject empty password', async () => {
      await expect(encrypt('data', '')).rejects.toThrow()
    })
  })
})

describe('Security: Worker Message Validation', () => {
  describe('validateWorkerRequest', () => {
    it('should accept valid check-support request', () => {
      const request = { type: 'check-support' }
      expect(validateWorkerRequest(request)).toBe(true)
    })

    it('should accept valid load-model request', () => {
      const request = { type: 'load-model', modelId: 'test-model-MLC' }
      expect(validateWorkerRequest(request)).toBe(true)
    })

    it('should accept valid generate request', () => {
      const request = {
        type: 'generate',
        messages: [{ role: 'user', content: 'Hello' }]
      }
      expect(validateWorkerRequest(request)).toBe(true)
    })

    it('should reject invalid message structure', () => {
      const request = { type: 'invalid' }
      expect(validateWorkerRequest(request)).toBe(false)
    })

    it('should reject missing required fields', () => {
      const request = { type: 'load-model' } // missing modelId
      expect(validateWorkerRequest(request)).toBe(false)
    })

    it('should reject invalid messages array', () => {
      const request = {
        type: 'generate',
        messages: [{ role: 'invalid-role', content: 'test' }]
      }
      expect(validateWorkerRequest(request)).toBe(false)
    })
  })

  describe('validateWorkerResponse', () => {
    it('should accept valid support-result response', () => {
      const response = { type: 'support-result', supported: true }
      expect(validateWorkerResponse(response)).toBe(true)
    })

    it('should accept valid load-complete response', () => {
      const response = { type: 'load-complete', modelId: 'test-model-MLC' }
      expect(validateWorkerResponse(response)).toBe(true)
    })

    it('should accept valid generate-token response', () => {
      const response = { type: 'generate-token', token: 'Hello' }
      expect(validateWorkerResponse(response)).toBe(true)
    })

    it('should reject invalid response structure', () => {
      const response = { type: 'unknown-type' }
      expect(validateWorkerResponse(response)).toBe(false)
    })
  })

  describe('isValidModelId', () => {
    it('should accept valid model IDs', () => {
      expect(isValidModelId('Llama-3.2-3B-Instruct-q4f16_1-MLC')).toBe(true)
      expect(isValidModelId('gemma-2-2b-it-q4f16_1-MLC')).toBe(true)
    })

    it('should reject empty model IDs', () => {
      expect(isValidModelId('')).toBe(false)
    })

    it('should reject model IDs with suspicious patterns', () => {
      expect(isValidModelId('<script>alert(1)</script>')).toBe(false)
      expect(isValidModelId('javascript:alert(1)')).toBe(false)
      expect(isValidModelId('../../../etc/passwd')).toBe(false)
    })
  })
})

describe('Security: Integration Tests', () => {
  it('should sanitize before rendering', () => {
    const userInput = '<script>alert("xss")</script>Normal text'
    const sanitized = sanitizeHtml(userInput)
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('Normal text')
  })

  it('should validate file before encryption', async () => {
    const content = 'a'.repeat(15000)
    const validation = validateContentSize(content)
    expect(validation.valid).toBe(false)
  })

  it('should chain security checks', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'

    // First check for dangerous content
    const isDangerous = containsDangerousContent(input)
    expect(isDangerous).toBe(true)

    // Then sanitize if needed
    const sanitized = sanitizeHtml(input)
    expect(sanitized).not.toContain('javascript:')
  })
})
