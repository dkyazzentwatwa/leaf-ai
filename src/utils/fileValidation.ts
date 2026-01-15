/**
 * File Upload Validation
 *
 * Protects against malicious files and DoS attacks by validating
 * file size, type, extension, and content before processing.
 *
 * @module fileValidation
 */

/** Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/** Maximum content size in characters after reading */
const MAX_CONTENT_SIZE = 12000

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.json',
  '.js', '.ts', '.tsx', '.jsx',
  '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.hpp',
  '.css', '.scss', '.sass', '.less',
  '.html', '.xml', '.yaml', '.yml', '.toml',
  '.sh', '.bash', '.zsh',
  '.sql', '.r', '.rb', '.php', '.swift', '.kt', '.scala',
]

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/javascript',
  'application/javascript',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-c++',
  'text/css',
  'text/html',
  'text/xml',
  'application/xml',
  'text/yaml',
  'application/x-yaml',
]

export interface FileValidationResult {
  valid: boolean
  error?: string
  file?: File
}

/**
 * Validate a file before processing
 * Performs comprehensive checks for security
 *
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = await validateFile(file)
 * if (!result.valid) {
 *   console.error(result.error)
 *   return
 * }
 * // Safe to process file
 * ```
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Basic file object validation
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: 'Invalid file object'
    }
  }

  // Size validation (before reading - prevents DoS)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`
    }
  }

  // Zero-byte file check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    }
  }

  // Extension validation
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type not supported. Allowed extensions: ${ALLOWED_EXTENSIONS.slice(0, 10).join(', ')}...`
    }
  }

  // MIME type validation (if available)
  // Note: MIME type can be spoofed, so we don't rely solely on it
  if (file.type && !ALLOWED_MIME_TYPES.some(mime => file.type.startsWith(mime))) {
    // Some files may have empty MIME type, so we allow that
    if (file.type !== '') {
      return {
        valid: false,
        error: `Invalid MIME type: ${file.type}`
      }
    }
  }

  // Content validation (read first 2KB as sample)
  try {
    const sample = await file.slice(0, 2048).text()

    // Check for binary content (null bytes indicate binary file)
    if (sample.includes('\0')) {
      return {
        valid: false,
        error: 'Binary files are not supported'
      }
    }

    // Check for suspicious content patterns
    const suspiciousPatterns = [
      /<script\b/i,               // Script tags
      /javascript:/i,             // JavaScript protocol
      /data:text\/html/i,         // Data URLs with HTML
      /on\w+\s*=\s*["']/i,        // Event handlers
      /vbscript:/i,               // VBScript protocol
      /<iframe\b/i,               // Iframe tags
      /<embed\b/i,                // Embed tags
      /<object\b/i,               // Object tags
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sample)) {
        return {
          valid: false,
          error: 'File contains potentially dangerous content'
        }
      }
    }

    // Check for excessive control characters (common in malicious files)
    const controlCharCount = (sample.match(/[\x00-\x08\x0E-\x1F\x7F]/g) || []).length
    const controlCharRatio = controlCharCount / sample.length

    if (controlCharRatio > 0.1) {
      return {
        valid: false,
        error: 'File contains excessive control characters'
      }
    }

  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read file content'
    }
  }

  // All checks passed
  return {
    valid: true,
    file
  }
}

/**
 * Sanitize a filename for safe display and storage
 * Removes dangerous characters and limits length
 *
 * @param name - Original filename
 * @param maxLength - Maximum length (default: 255)
 * @returns Sanitized filename
 *
 * @example
 * ```typescript
 * sanitizeFileName('../../etc/passwd') // 'etc-passwd'
 * sanitizeFileName('file<script>.txt') // 'filescript.txt'
 * ```
 */
export function sanitizeFileName(name: string, maxLength = 255): string {
  if (!name || typeof name !== 'string') {
    return 'unnamed-file'
  }

  return name
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    // Replace spaces and special chars with underscore
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Remove multiple consecutive underscores
    .replace(/_{2,}/g, '_')
    // Remove leading/trailing underscores and dots
    .replace(/^[_.-]+|[_.-]+$/g, '')
    // Limit length
    .slice(0, maxLength)
    // Ensure not empty after sanitization
    || 'unnamed-file'
}

/**
 * Validate file content size after reading
 * Used as a secondary check after initial file size validation
 *
 * @param content - File content string
 * @returns Validation result
 */
export function validateContentSize(content: string): FileValidationResult {
  if (content.length > MAX_CONTENT_SIZE) {
    return {
      valid: false,
      error: `Content too large. Maximum: ${MAX_CONTENT_SIZE} characters. Consider using a smaller excerpt.`
    }
  }

  return {
    valid: true
  }
}

/**
 * Get human-readable file size string
 * Utility for displaying file sizes to users
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
