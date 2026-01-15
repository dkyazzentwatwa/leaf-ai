# Security Policy

## Overview

Leaf AI takes security and privacy seriously. This document outlines our security features, practices, and vulnerability disclosure policy.

## Security Features

### 1. Content Sanitization (XSS Protection)

All AI-generated content is sanitized before rendering using native browser security APIs:

- **DOMParser + TreeWalker**: Parses and sanitizes HTML safely without external dependencies
- **Whitelist Approach**: Only allows safe tags (a, b, code, em, h1-h6, hr, i, li, ol, p, pre, strong, ul, span, div)
- **URL Validation**: Blocks dangerous protocols (javascript:, data:, vbscript:, file:)
- **Event Handler Removal**: Strips all event handlers (onclick, onload, etc.)

**Implementation**: `src/utils/sanitize.ts`

### 2. End-to-End Encryption at Rest

Optional AES-256-GCM encryption for all conversations:

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations + SHA-256
- **Salt Storage**: 16-byte random salt in localStorage
- **IV**: 12-byte random IV per encryption operation
- **Password Never Leaves Device**: All encryption/decryption happens locally using Web Crypto API

**How to Enable**:
1. Go to Settings
2. Enable "Data Encryption"
3. Set a strong password (min 8 characters, complexity recommended)
4. **WARNING**: If you forget your password, your data cannot be recovered

**Implementation**: `src/utils/encryption.ts`

### 3. Content Security Policy (CSP)

Strict CSP headers prevent script injection and unauthorized resource loading:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://huggingface.co blob:;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
```

**Note**: `'wasm-unsafe-eval'` is required for WebLLM/WebAssembly execution. `https://huggingface.co` is required for model downloads.

**Implementation**: `vite.config.ts`, `public/_headers`

### 4. Secure File Validation

File uploads are validated before processing to prevent DoS attacks and malicious file execution:

- **Size Limit**: 5MB maximum
- **Content Limit**: 12,000 characters after reading
- **Extension Whitelist**: .txt, .md, .json, .js, .ts, code files only
- **MIME Type Validation**: Validates content type matches extension
- **Binary Detection**: Blocks binary files (null byte detection)
- **Suspicious Pattern Scanning**: Detects script tags, javascript:, event handlers
- **Control Character Check**: Flags excessive control characters (>10% of content)

**Implementation**: `src/utils/fileValidation.ts`

### 5. Input Sanitization

All user inputs via window.prompt/confirm are sanitized:

- **Length Limits**: Default 200 chars, configurable per input
- **Pattern Validation**: Optional regex validation
- **HTML Entity Escaping**: Prevents stored XSS
- **Empty Input Handling**: Rejects empty inputs by default

**Implementation**: `src/utils/userInput.ts`

### 6. Secure Deletion

Deleted conversations are cryptographically erased from browser storage:

- **Overwriting**: Data overwritten with random values before deletion (3 passes)
- **localStorage**: Secure deletion of all keys
- **IndexedDB**: Records overwritten then deleted
- **Secure Wipe**: Option to erase ALL application data including downloaded models

**How to Use Secure Wipe**:
1. Go to Settings
2. Scroll to "Local Backup" section
3. Click "Secure Wipe" button
4. Confirm the action (irreversible)

**Implementation**: `src/utils/secureDelete.ts`

### 7. Worker Isolation & Message Validation

AI processing runs in isolated Web Workers with runtime type checking:

- **Separate Thread**: All AI inference runs in Web Workers (not main thread)
- **Message Validation**: All worker messages validated for structure and type
- **Request Sanitization**: Invalid messages are rejected before processing
- **Error Handling**: Validation failures logged but don't crash the app

**Implementation**: `src/features/ai/workers/validation.ts`

## Data Storage Locations

All data is stored locally in your browser:

### localStorage (Settings & Keys)
- User preferences (preferred model, auto-load settings)
- Privacy mode status
- Encryption enabled flag
- Encryption salt (if encryption enabled)
- Prompt templates

### IndexedDB (via Dexie)
- **Database**: `leaf-ai-db`
- **Store**: `aiConversations`
- Content: Conversation history, messages, bookmarks, reactions
- Encryption: Optional (if user enables it)

### IndexedDB (via WebLLM)
- **Database**: WebLLM internal cache
- Content: Downloaded AI models, model weights
- Size: 400MB-7GB depending on model

### Service Worker Cache
- **Cache Name**: Workbox-managed caches
- Content: Application assets (HTML, CSS, JS, images)
- Size: ~10-20MB

## How to Securely Wipe All Data

If you want to completely remove Leaf AI from your device:

1. **Via Settings** (Recommended):
   - Go to Settings → Local Backup
   - Click "Secure Wipe"
   - Confirm the action
   - Page will reload with fresh state

2. **Via Browser DevTools**:
   ```javascript
   // Open browser console (F12)
   localStorage.clear()
   indexedDB.deleteDatabase('leaf-ai-db')
   indexedDB.deleteDatabase('tvmjs') // WebLLM cache
   caches.keys().then(names => names.forEach(name => caches.delete(name)))
   ```

3. **Via Browser Settings**:
   - Chrome: Settings → Privacy → Clear browsing data → Cookies and site data
   - Firefox: Settings → Privacy → Clear Data → Cookies and Site Data
   - Safari: Settings → Privacy → Manage Website Data → Remove All

## Security Best Practices for Users

1. **Enable Encryption**: For sensitive conversations, enable encryption in Settings
2. **Use Strong Passwords**: If using encryption, choose a strong, unique password (min 12 chars)
3. **Keep Browser Updated**: Ensure you're using the latest browser version for WebGPU/security patches
4. **Lock Devices**: Use device-level locks (PIN/biometric) as first line of defense
5. **Privacy Mode**: Enable Privacy Mode (Settings) for visual privacy (blurs screen content)
6. **Secure Deletion**: Use "Secure Wipe" instead of just clearing conversations for sensitive data

## Vulnerability Disclosure Policy

If you discover a security vulnerability in Leaf AI, please report it responsibly:

### Reporting Process

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. **Do** email security details to: [Create a private GitHub Security Advisory at https://github.com/dkyazzentwatwa/leaf-ai/security/advisories/new]
3. Include in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### Response Timeline

- **24 hours**: Acknowledgment of report
- **7 days**: Initial assessment and triage
- **30 days**: Target fix deployment (depending on severity)

### Scope

**In Scope**:
- XSS vulnerabilities
- CSP bypasses
- Encryption weaknesses
- File upload exploits
- Input validation bypasses
- Data exfiltration techniques

**Out of Scope**:
- Social engineering attacks
- Physical access attacks
- Browser/OS vulnerabilities (report to browser vendors)
- Denial of Service (DoS) against local device (expected - users control their resources)
- Issues in third-party dependencies (report to those projects)

## Security Audit History

### Internal Audit (January 2026)

**Findings**:
- 1 HIGH: XSS in message rendering → **FIXED** (sanitize.ts)
- 3 MEDIUM: File validation, input injection, missing CSP → **FIXED**
- 1 LOW: Worker message validation → **FIXED**

**Actions Taken**:
- Implemented content sanitization
- Added file upload validation
- Configured Content Security Policy
- Added Web Crypto encryption
- Implemented secure deletion
- Added worker message validation

**Status**: All findings addressed ✅

## Third-Party Dependencies

Leaf AI minimizes external dependencies for security. Key dependencies:

1. **@mlc-ai/web-llm**: AI inference engine
   - Source: https://github.com/mlc-ai/web-llm
   - Purpose: On-device LLM execution
   - Risk: Low (open source, well-maintained)

2. **React**: UI framework
   - Source: https://github.com/facebook/react
   - Purpose: User interface
   - Risk: Very low (industry standard)

3. **Zustand**: State management
   - Source: https://github.com/pmndrs/zustand
   - Purpose: App state
   - Risk: Very low (minimal, well-audited)

4. **Dexie**: IndexedDB wrapper
   - Source: https://github.com/dexie/Dexie.js
   - Purpose: Local database
   - Risk: Low (widely used, actively maintained)

**Note**: All security-critical utilities (sanitization, encryption, validation) are implemented using **native browser APIs** with zero external dependencies.

## Browser Security Requirements

Leaf AI requires modern browsers with:

- **WebGPU**: For AI acceleration
- **Web Crypto API**: For encryption (if enabled)
- **Web Workers**: For AI processing isolation
- **SharedArrayBuffer**: For WebLLM (requires COOP/COEP headers)
- **IndexedDB**: For local storage

**Minimum Versions**:
- Chrome 113+
- Edge 113+
- Safari 26+ (iOS 26+)
- Brave (latest)

## Privacy Philosophy

Leaf AI is built on these principles:

- ✅ **Zero Tracking**: No analytics, no telemetry, no cookies
- ✅ **Zero External Servers**: All processing happens on your device
- ✅ **Zero User Accounts**: No sign-up, no authentication servers
- ✅ **Open Source**: Fully auditable code
- ✅ **Local-First**: Data never leaves your device
- ✅ **Encryption Available**: Optional E2EE for data at rest

## Technical Details

**Encryption Specifications**:
- Algorithm: AES-256-GCM (Galois/Counter Mode)
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: 100,000
- Salt: 16 bytes (random)
- IV: 12 bytes (random per operation)

**Sanitization Approach**:
- Parser: DOMParser (native)
- Traversal: TreeWalker (native)
- Strategy: Whitelist (allow known-safe tags only)
- URL Validation: URL API (native)

**File Validation**:
- Pre-read checks: Size, extension, MIME type
- Post-read checks: Binary detection, pattern scanning, control characters
- Limits: 5MB file size, 12,000 chars content

## Contact

- **GitHub**: https://github.com/dkyazzentwatwa/leaf-ai
- **Issues**: https://github.com/dkyazzentwatwa/leaf-ai/issues (non-security only)
- **Security**: Use GitHub Security Advisories for vulnerability reports

---

**Last Updated**: January 2026
**Version**: 2.0 (Security Enhanced)
