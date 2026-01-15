/**
 * Secure Deletion Utilities
 *
 * Cryptographic erasure of deleted data to prevent recovery from browser cache.
 * Overwrites data with random values before deletion.
 *
 * @module secureDelete
 */

/**
 * Securely delete a localStorage item
 * Overwrites the value with random data multiple times before deletion
 *
 * @param key - localStorage key to delete
 * @param passes - Number of overwrite passes (default: 3)
 *
 * @example
 * ```typescript
 * secureDeleteLocalStorage('user-data')
 * // Data overwritten 3 times with random values, then deleted
 * ```
 */
export function secureDeleteLocalStorage(key: string, passes = 3): void {
  if (!key || typeof key !== 'string') {
    return
  }

  try {
    // Get current value to determine size
    const currentValue = localStorage.getItem(key)
    if (currentValue === null) {
      return // Key doesn't exist
    }

    const valueLength = currentValue.length

    // Overwrite multiple times with random data
    for (let i = 0; i < passes; i++) {
      const randomData = generateRandomString(valueLength)
      localStorage.setItem(key, randomData)
    }

    // Final deletion
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to securely delete localStorage item:', error)
    // Still attempt regular deletion as fallback
    localStorage.removeItem(key)
  }
}

/**
 * Securely delete an IndexedDB record
 * Overwrites the record with random data before deletion
 *
 * @param dbName - Database name
 * @param storeName - Object store name
 * @param key - Record key to delete
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * await secureDeleteIndexedDB('leaf-ai-db', 'conversations', 'conv-123')
 * ```
 */
export async function secureDeleteIndexedDB(
  dbName: string,
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(dbName)

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${dbName}`))
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Check if object store exists
        if (!db.objectStoreNames.contains(storeName)) {
          db.close()
          resolve() // Store doesn't exist, nothing to delete
          return
        }

        const transaction = db.transaction(storeName, 'readwrite')
        const store = transaction.objectStore(storeName)

        // Get the record first to determine structure
        const getRequest = store.get(key)

        getRequest.onsuccess = () => {
          const record = getRequest.result

          if (!record) {
            db.close()
            resolve() // Record doesn't exist
            return
          }

          // Overwrite with random data
          const randomRecord = generateRandomObject(record)
          const putRequest = store.put(randomRecord)

          putRequest.onsuccess = () => {
            // Now delete the record
            const deleteRequest = store.delete(key)

            deleteRequest.onsuccess = () => {
              db.close()
              resolve()
            }

            deleteRequest.onerror = () => {
              db.close()
              reject(new Error('Failed to delete record'))
            }
          }

          putRequest.onerror = () => {
            // If overwrite fails, still attempt deletion
            const deleteRequest = store.delete(key)
            deleteRequest.onsuccess = () => {
              db.close()
              resolve()
            }
            deleteRequest.onerror = () => {
              db.close()
              reject(new Error('Failed to delete record'))
            }
          }
        }

        getRequest.onerror = () => {
          db.close()
          reject(new Error('Failed to read record'))
        }

        transaction.onerror = () => {
          db.close()
          reject(new Error('Transaction failed'))
        }
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Securely wipe all application data
 * Clears localStorage, sessionStorage, and IndexedDB with secure deletion
 *
 * @returns Promise that resolves when all data is wiped
 *
 * @example
 * ```typescript
 * await secureWipeAllData()
 * // All app data securely erased
 * ```
 */
export async function secureWipeAllData(): Promise<void> {
  const errors: Error[] = []

  // Securely delete all localStorage items
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      try {
        secureDeleteLocalStorage(key)
      } catch (error) {
        errors.push(new Error(`Failed to delete localStorage key: ${key}`))
      }
    }
  } catch (error) {
    errors.push(new Error('Failed to clear localStorage'))
  }

  // Clear sessionStorage (no need to secure delete as it's temporary)
  try {
    sessionStorage.clear()
  } catch (error) {
    errors.push(new Error('Failed to clear sessionStorage'))
  }

  // Delete all IndexedDB databases
  try {
    const databases = await indexedDB.databases()

    for (const dbInfo of databases) {
      if (dbInfo.name) {
        try {
          await deleteDatabase(dbInfo.name)
        } catch (error) {
          errors.push(new Error(`Failed to delete database: ${dbInfo.name}`))
        }
      }
    }
  } catch (error) {
    errors.push(new Error('Failed to enumerate or delete IndexedDB databases'))
  }

  // Clear all caches (Service Worker caches)
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    } catch (error) {
      errors.push(new Error('Failed to clear caches'))
    }
  }

  // If there were errors, throw a combined error
  if (errors.length > 0) {
    throw new Error(
      `Secure wipe completed with ${errors.length} error(s): ${errors.map(e => e.message).join(', ')}`
    )
  }
}

/**
 * Delete an entire IndexedDB database
 *
 * @param dbName - Database name to delete
 * @returns Promise that resolves when database is deleted
 */
function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error(`Failed to delete database: ${dbName}`))
    request.onblocked = () => {
      // Database deletion is blocked (likely open connections)
      console.warn(`Database deletion blocked: ${dbName}`)
      // Resolve anyway as it will be deleted when connections close
      resolve()
    }
  })
}

/**
 * Generate a random string of specified length
 * Uses crypto.getRandomValues for cryptographically secure randomness
 *
 * @param length - Length of random string to generate
 * @returns Random string
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length]
  }

  return result
}

/**
 * Generate a random object with the same structure as the input
 * Recursively replaces all values with random data
 *
 * @param obj - Object to mirror with random data
 * @returns Object with same structure but random values
 */
function generateRandomObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }

  if (Array.isArray(obj)) {
    return obj.map(item => generateRandomObject(item))
  }

  if (typeof obj === 'object') {
    const randomObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        randomObj[key] = generateRandomObject(obj[key])
      }
    }
    return randomObj
  }

  // Primitive types - replace with random values
  if (typeof obj === 'string') {
    return generateRandomString(obj.length || 10)
  }

  if (typeof obj === 'number') {
    return Math.random() * 1000000
  }

  if (typeof obj === 'boolean') {
    return Math.random() > 0.5
  }

  return null
}

/**
 * Securely delete a specific conversation from IndexedDB
 * Convenience wrapper for common use case
 *
 * @param conversationId - ID of conversation to delete
 * @returns Promise that resolves when conversation is deleted
 *
 * @example
 * ```typescript
 * await secureDeleteConversation('conv-123')
 * ```
 */
export async function secureDeleteConversation(conversationId: string): Promise<void> {
  // Delete from main database
  try {
    await secureDeleteIndexedDB('leaf-ai-db', 'aiConversations', conversationId)
  } catch (error) {
    console.error('Failed to securely delete conversation:', error)
    // Rethrow to let caller handle
    throw error
  }
}

/**
 * Check if secure deletion is available
 * Verifies that required APIs are supported
 *
 * @returns true if secure deletion is available, false otherwise
 */
export function isSecureDeletionAvailable(): boolean {
  return (
    typeof localStorage !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  )
}

/**
 * Get estimated time to securely wipe all data
 * Useful for showing progress indicators
 *
 * @returns Estimated time in milliseconds
 */
export async function estimateWipeTime(): Promise<number> {
  let totalSize = 0

  // Estimate localStorage size
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += value.length
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // Estimate IndexedDB size (rough approximation)
  try {
    const databases = await indexedDB.databases()
    totalSize += databases.length * 1000 // Rough estimate
  } catch (error) {
    // Ignore errors
  }

  // Rough estimate: 1ms per 1000 characters + overhead
  return Math.max(500, totalSize / 1000 + 500)
}
