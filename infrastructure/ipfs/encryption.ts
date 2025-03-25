/**
 * Encryption utilities for IPFS data
 * Provides functionality to encrypt and decrypt data for secure storage
 */

import crypto from 'crypto';

/**
 * Result of data encryption
 */
export interface EncryptionResult {
  encryptedData: Buffer;
  key: string;
  iv: string;
}

/**
 * Generate a random encryption key
 * @returns Buffer containing the key
 */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(32); // 256 bits key
}

/**
 * Convert encryption key to string for storage
 * @param key Encryption key buffer
 * @returns Base64 encoded key string
 */
export function keyToString(key: Buffer): string {
  return key.toString('base64');
}

/**
 * Convert string key back to buffer for encryption/decryption
 * @param keyString Base64 encoded key string
 * @returns Buffer containing the key
 */
export function stringToKey(keyString: string): Buffer {
  return Buffer.from(keyString, 'base64');
}

/**
 * Encrypt data with AES-256-GCM
 * @param data Data to encrypt
 * @param existingKey Optional existing encryption key (base64 string)
 * @returns Encryption result with encrypted data and key
 */
export async function encryptData(
  data: Buffer,
  existingKey?: string
): Promise<EncryptionResult> {
  // Use existing key or generate a new one
  const key = existingKey ? stringToKey(existingKey) : generateEncryptionKey();
  const iv = crypto.randomBytes(16); // Initialization vector

  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Encrypt the data
  const encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine IV, auth tag, and encrypted data into a single buffer
  const result = Buffer.concat([
    iv,             // First 16 bytes: IV
    authTag,        // Next 16 bytes: Auth tag
    encryptedData   // Remaining bytes: Encrypted data
  ]);

  return {
    encryptedData: result,
    key: keyToString(key),
    iv: iv.toString('base64')
  };
}

/**
 * Decrypt data with AES-256-GCM
 * @param encryptedBuffer Encrypted data buffer (including IV and auth tag)
 * @param keyString Base64 encoded encryption key
 * @returns Decrypted data buffer
 */
export async function decryptData(
  encryptedBuffer: Buffer,
  keyString: string
): Promise<Buffer> {
  try {
    const key = stringToKey(keyString);

    // Extract IV, auth tag, and encrypted data
    const iv = encryptedBuffer.subarray(0, 16);
    const authTag = encryptedBuffer.subarray(16, 32);
    const encryptedData = encryptedBuffer.subarray(32);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Hash data for integrity verification
 * @param data Data to hash
 * @returns SHA-256 hash of the data
 */
export function hashData(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify data integrity using hash
 * @param data Data to verify
 * @param expectedHash Expected hash value
 * @returns Whether the data matches the hash
 */
export function verifyDataIntegrity(data: Buffer, expectedHash: string): boolean {
  const actualHash = hashData(data);
  return actualHash === expectedHash;
}

/**
 * Encrypt file metadata for added security
 * @param metadata Metadata object
 * @param key Encryption key
 * @returns Encrypted metadata string
 */
export function encryptMetadata(metadata: Record<string, any>, key: string): string {
  const metadataString = JSON.stringify(metadata);
  const metadataBuffer = Buffer.from(metadataString);
  return encryptData(metadataBuffer, key)
    .then(result => result.encryptedData.toString('base64'));
}

/**
 * Decrypt file metadata
 * @param encryptedMetadata Encrypted metadata string
 * @param key Decryption key
 * @returns Decrypted metadata object
 */
export async function decryptMetadata(
  encryptedMetadata: string,
  key: string
): Promise<Record<string, any>> {
  const encryptedBuffer = Buffer.from(encryptedMetadata, 'base64');
  const decryptedBuffer = await decryptData(encryptedBuffer, key);
  const metadataString = decryptedBuffer.toString();
  return JSON.parse(metadataString);
}
