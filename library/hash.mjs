/**
 * sha256 a string or array
 * @param {string|UInt8Array} message
 * @returns {UInt8Array} hash
 */
export async function sha256 (message) {
  const msgUint8 = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8)
  return new Uint8Array(hashBuffer)
}

/**
 * Convert a UInt8Array in to a hex string
 * @param {UInt8Array} array - byte array
 * @returns {string}
 */
export function arrayToHex (array) {
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}
