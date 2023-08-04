/**
 * Extracts the encryption key from an encrypted CID.
 * @param {string} encryptedCid - The encrypted CID to get the key from.
 * @returns {string} The encryption key from the CID.
 */
export function getKeyFromEncryptedCid(encryptedCid) {
  const extensionIndex = encryptedCid.lastIndexOf('.')

  let cidWithoutExtension
  if (extensionIndex !== -1) {
    cidWithoutExtension = encryptedCid.slice(0, extensionIndex)
  } else {
    cidWithoutExtension = encryptedCid
  }
  console.log('getKeyFromEncryptedCid: encryptedCid = ', encryptedCid)
  console.log(
    'getKeyFromEncryptedCid: cidWithoutExtension = ',
    cidWithoutExtension
  )

  cidWithoutExtension = cidWithoutExtension.slice(1)
  const cidBytes = convertBase64urlToBytes(cidWithoutExtension)
  const startIndex = cidBytes.length - 36 - 32 - 5
  const endIndex = cidBytes.length - 36 - 5
  const selectedBytes = cidBytes.slice(startIndex, endIndex)

  const key = convertBytesToBase64url(selectedBytes)
  console.log('getKeyFromEncryptedCid: key = ', key)

  return key
}

/**
 * Removes the encryption key from an encrypted CID.
 * @param {string} encryptedCid - The encrypted CID to remove the key from.
 * @returns {string} The CID with the encryption key removed.
 */
export function removeKeyFromEncryptedCid(encryptedCid) {
  console.log('removeKeyFromEncryptedCid: encryptedCid = ', encryptedCid)

  const extensionIndex = encryptedCid.lastIndexOf('.')
  const cidWithoutExtension =
    extensionIndex === -1 ? encryptedCid : encryptedCid.slice(0, extensionIndex)

  // remove 'u' prefix as well
  const cidWithoutExtensionBytes = convertBase64urlToBytes2(
    cidWithoutExtension.slice(1)
  )
  console.log(
    'removeKeyFromEncryptedCid: cidWithoutExtensionBytes = ',
    cidWithoutExtensionBytes
  )

  const part1 = cidWithoutExtensionBytes.slice(0, -32 - 4 - 32 - 5)
  const part2 = cidWithoutExtensionBytes.slice(-4 - 32 - 5)

  const combinedBytes = new Uint8Array(cidWithoutExtensionBytes.length - 32)
  combinedBytes.set(part1)
  combinedBytes.set(part2, part1.length)

  const cidWithoutKey = 'u' + convertBytesToBase64url(combinedBytes)
  return cidWithoutKey
}

/**
 * Combines an encryption key with an encrypted CID.
 * @param {string} key - The encryption key to combine with the encrypted CID.
 * @param {string} encryptedCidWithoutKey - The encrypted CID without the encryption key.
 * @returns {string} The encrypted CID with the encryption key combined.
 */
export function combineKeytoEncryptedCid(key, encryptedCidWithoutKey) {
  const extensionIndex = encryptedCidWithoutKey.lastIndexOf('.')
  const cidWithoutKeyAndExtension =
    extensionIndex === -1
      ? encryptedCidWithoutKey
      : encryptedCidWithoutKey.slice(0, extensionIndex)

  const encryptedCidWithoutKeyBytes = convertBase64urlToBytes(
    cidWithoutKeyAndExtension.slice(1)
  )

  const keyBytes = convertBase64urlToBytes(key)

  const combinedBytes = new Uint8Array(
    encryptedCidWithoutKeyBytes.length + keyBytes.length
  )

  const part1 = encryptedCidWithoutKeyBytes.slice(0, -36 - 5)
  const part2 = encryptedCidWithoutKeyBytes.slice(-36 - 5)

  console.log('combineKeytoEncryptedCid: part1  = ', part1)
  console.log('combineKeytoEncryptedCid: part2  = ', part2)

  combinedBytes.set(part1)
  combinedBytes.set(keyBytes, part1.length)
  combinedBytes.set(part2, part1.length + keyBytes.length)

  const encryptedCid = `u` + convertBytesToBase64url(combinedBytes)
  return encryptedCid
}

export function convertBytesToBase64url(hashBytes) {
  const mHash = Buffer.from(hashBytes)

  // Convert the hash Buffer to a Base64 string
  const hashBase64 = mHash.toString('base64')

  // Make the Base64 string URL-safe
  const hashBase64url = hashBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace('=', '')

  return hashBase64url
}

export function convertBase64urlToBytes2(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  var rawData = atob(base64)
  var outputArray = new Uint8Array(rawData.length)

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function convertBase64urlToBytes(b64url) {
  // Convert the URL-safe Base64 string to a regular Base64 string
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')

  // Add missing padding
  while (b64.length % 4) {
    b64 += '='
  }

  // Convert Base64 string to Buffer
  const buffer = Buffer.from(b64, 'base64')

  // Convert Buffer to Uint8Array
  const mHash = Uint8Array.from(buffer)

  return mHash
}
