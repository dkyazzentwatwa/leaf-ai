/**
 * Content Sanitization Utilities
 *
 * Provides XSS protection for user-generated and AI-generated content.
 * Uses native browser APIs (DOMParser, TreeWalker) to maintain local-first philosophy.
 *
 * @module sanitize
 */

interface SanitizeConfig {
  ALLOWED_TAGS: string[]
  ALLOWED_ATTR: string[]
  ALLOWED_URI_REGEXP: RegExp
}

const DEFAULT_CONFIG: SanitizeConfig = {
  // Allow basic formatting and structure tags
  ALLOWED_TAGS: [
    'a', 'b', 'blockquote', 'br', 'code', 'em', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 'strong', 'ul',
    'span', 'div'
  ],
  // Allow only safe attributes
  ALLOWED_ATTR: ['href', 'title', 'class'],
  // Only allow https: and mailto: protocols
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
}

/**
 * Sanitize HTML string to prevent XSS attacks
 * Uses native DOMParser + TreeWalker for security
 *
 * @param dirty - Potentially unsafe HTML string
 * @param config - Sanitization configuration (optional)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * const clean = sanitizeHtml('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 * ```
 */
export function sanitizeHtml(dirty: string, config: SanitizeConfig = DEFAULT_CONFIG): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  // Parse HTML safely using DOMParser
  const parser = new DOMParser()
  const doc = parser.parseFromString(dirty, 'text/html')

  // Check for parser errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    // If parsing failed, return empty string
    return ''
  }

  // Use TreeWalker to traverse all nodes
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  )

  const nodesToRemove: Node[] = []

  while (walker.nextNode()) {
    const node = walker.currentNode

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()

      // Remove disallowed tags
      if (!config.ALLOWED_TAGS.includes(tagName)) {
        nodesToRemove.push(node)
        continue
      }

      // Sanitize attributes
      const attrs = Array.from(element.attributes)
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase()

        // Remove disallowed attributes
        if (!config.ALLOWED_ATTR.includes(attrName)) {
          element.removeAttribute(attr.name)
          continue
        }

        // Special validation for href attributes
        if (attrName === 'href') {
          const href = attr.value.trim()

          // Block dangerous protocols
          if (
            href.toLowerCase().startsWith('javascript:') ||
            href.toLowerCase().startsWith('data:') ||
            href.toLowerCase().startsWith('vbscript:') ||
            href.toLowerCase().startsWith('file:')
          ) {
            element.removeAttribute('href')
            continue
          }

          // Validate URL matches allowed pattern
          if (!config.ALLOWED_URI_REGEXP.test(href)) {
            element.removeAttribute('href')
          }
        }
      }

      // Remove event handler attributes (onclick, onload, etc.)
      // Even if they're not in ALLOWED_ATTR, be extra safe
      const allAttrs = Array.from(element.attributes)
      for (const attr of allAttrs) {
        if (attr.name.toLowerCase().startsWith('on')) {
          element.removeAttribute(attr.name)
        }
      }
    }
  }

  // Remove dangerous nodes collected during traversal
  nodesToRemove.forEach(node => {
    node.parentNode?.removeChild(node)
  })

  // Return sanitized HTML
  return doc.body.innerHTML
}

/**
 * Sanitize plain text for safe HTML insertion
 * Escapes HTML entities to prevent XSS
 *
 * @param text - Plain text string
 * @returns HTML-safe string with entities escaped
 *
 * @example
 * ```typescript
 * const safe = sanitizeText('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * ```
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Use textContent to escape HTML entities
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Validate if a URL is safe for use
 * Checks protocol and basic URL structure
 *
 * @param url - URL string to validate
 * @returns true if URL is safe, false otherwise
 *
 * @example
 * ```typescript
 * isUrlSafe('https://example.com') // true
 * isUrlSafe('javascript:alert(1)') // false
 * ```
 */
export function isUrlSafe(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    // Parse URL relative to current origin
    const parsed = new URL(url, window.location.origin)

    // Only allow http, https, and mailto protocols
    const safeProtocols = ['http:', 'https:', 'mailto:']
    return safeProtocols.includes(parsed.protocol)
  } catch {
    // If URL parsing fails, it's not safe
    return false
  }
}

/**
 * Sanitize a code block (preserve content but escape HTML)
 * Special handling for code blocks to maintain formatting
 *
 * @param code - Code string
 * @returns Sanitized code with HTML escaped
 */
export function sanitizeCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return ''
  }

  // Escape HTML but preserve whitespace and newlines
  return sanitizeText(code)
}

/**
 * Check if a string contains potentially dangerous content
 * Useful for pre-validation before processing
 *
 * @param content - String to check
 * @returns true if content appears dangerous, false otherwise
 */
export function containsDangerousContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe\b/i,
    /<embed\b/i,
    /<object\b/i,
  ]

  return dangerousPatterns.some(pattern => pattern.test(content))
}
