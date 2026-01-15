/**
 * User Input Sanitization
 *
 * Safe wrappers for window.prompt and window.confirm that validate
 * and sanitize user input to prevent injection attacks.
 *
 * @module userInput
 */

import { sanitizeText } from './sanitize'

export interface PromptOptions {
  /** Maximum allowed length of input */
  maxLength?: number
  /** Allow empty input */
  allowEmpty?: boolean
  /** Regular expression pattern to validate input */
  pattern?: RegExp
  /** Sanitize HTML entities (default: true) */
  sanitize?: boolean
  /** Custom error message for validation failures */
  errorMessage?: string
}

const DEFAULT_OPTIONS: PromptOptions = {
  maxLength: 200,
  allowEmpty: false,
  sanitize: true
}

/**
 * Safe wrapper for window.prompt with validation and sanitization
 *
 * @param message - Prompt message to display
 * @param defaultValue - Default value for input
 * @param options - Validation and sanitization options
 * @returns Sanitized user input or null if cancelled/invalid
 *
 * @example
 * ```typescript
 * // Basic usage
 * const name = safePrompt('Enter your name:')
 *
 * // With validation
 * const email = safePrompt('Enter email:', '', {
 *   pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *   errorMessage: 'Invalid email format'
 * })
 *
 * // Allow longer input
 * const description = safePrompt('Description:', '', {
 *   maxLength: 500,
 *   allowEmpty: true
 * })
 * ```
 */
export function safePrompt(
  message: string,
  defaultValue = '',
  options: PromptOptions = {}
): string | null {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Sanitize the prompt message itself
  const sanitizedMessage = opts.sanitize ? sanitizeText(message) : message

  // Show prompt
  const result = window.prompt(sanitizedMessage, defaultValue)

  // User cancelled
  if (result === null) {
    return null
  }

  // Trim whitespace
  let sanitized = result.trim()

  // Empty check
  if (!sanitized && !opts.allowEmpty) {
    return null
  }

  // Length validation
  if (opts.maxLength && sanitized.length > opts.maxLength) {
    sanitized = sanitized.slice(0, opts.maxLength)
  }

  // Pattern validation
  if (opts.pattern && !opts.pattern.test(sanitized)) {
    if (opts.errorMessage) {
      // Show error message if validation fails
      alert(opts.errorMessage)
    }
    return null
  }

  // HTML sanitization (escape entities)
  if (opts.sanitize) {
    sanitized = sanitizeText(sanitized)
      // Decode sanitized text to restore readable characters
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      // Then re-escape to remove actual HTML/script tags
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  return sanitized
}

/**
 * Safe wrapper for window.confirm with message sanitization
 *
 * @param message - Confirmation message to display
 * @returns true if user clicked OK, false if cancelled
 *
 * @example
 * ```typescript
 * if (safeConfirm('Delete this item?')) {
 *   // User confirmed
 *   deleteItem()
 * }
 * ```
 */
export function safeConfirm(message: string): boolean {
  // Sanitize the confirmation message
  const sanitized = sanitizeText(message)
  return window.confirm(sanitized)
}

/**
 * Validate a string against common injection patterns
 * Use this for additional validation beyond sanitization
 *
 * @param input - String to validate
 * @returns true if input is safe, false if suspicious
 *
 * @example
 * ```typescript
 * const userInput = getUserInput()
 * if (!isInputSafe(userInput)) {
 *   console.warn('Suspicious input detected')
 * }
 * ```
 */
export function isInputSafe(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true // Empty/null is safe
  }

  // Patterns that might indicate injection attempts
  const suspiciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe\b/i,
    /document\./i,
    /window\./i,
    /eval\(/i,
    /setTimeout\(/i,
    /setInterval\(/i,
  ]

  return !suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitize input for use in titles, tags, and other metadata
 * More permissive than full HTML sanitization
 *
 * @param input - String to sanitize
 * @param maxLength - Maximum length (default: 100)
 * @returns Sanitized string
 *
 * @example
 * ```typescript
 * const title = sanitizeMetadata(userInput, 100)
 * ```
 */
export function sanitizeMetadata(input: string, maxLength = 100): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Limit length
    .slice(0, maxLength)
    .trim()
}

/**
 * Validate and sanitize a comma-separated list (for tags, etc.)
 * Returns array of sanitized items
 *
 * @param input - Comma-separated string
 * @param maxItems - Maximum number of items (default: 10)
 * @param maxItemLength - Maximum length per item (default: 50)
 * @returns Array of sanitized strings
 *
 * @example
 * ```typescript
 * const tags = sanitizeList('tag1, tag2, tag3', 5, 20)
 * // Returns: ['tag1', 'tag2', 'tag3']
 * ```
 */
export function sanitizeList(
  input: string,
  maxItems = 10,
  maxItemLength = 50
): string[] {
  if (!input || typeof input !== 'string') {
    return []
  }

  return input
    .split(',')
    .map(item => sanitizeMetadata(item, maxItemLength))
    .filter(Boolean) // Remove empty items
    .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
    .slice(0, maxItems) // Limit number of items
}
