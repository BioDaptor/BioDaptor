/**
 * IPFS Client for BioDaptor
 * Provides functionality to interact with IPFS for decentralized storage
 */

import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { IPFSContent } from '@shared/types';
import { encryptData, decryptData } from './encryption';

/**
 * Configuration options for the IPFS client
 */
export interface IPFSClientConfig {
  host: string;
  port: number;
  protocol: string;
  apiPath?: string;
  headers?: Record<string, string>;
}

/**
 * Default IPFS client configuration
 */
const DEFAULT_CONFIG: IPFSClientConfig = {
  host: process.env.IPFS_HOST || 'localhost',
  port: parseInt(process.env.IPFS_PORT || '5001'),
  protocol: process.env.IPFS_PROTOCOL || 'http',
  apiPath: process.env.IPFS_API_PATH || '/api/v0',
};

/**
 * IPFS client wrapper class for BioDaptor
 */
export class IPFSClient {
  private client: IPFSHTTPClient;
  private config: IPFSClientConfig;

  /**
   * Create a new IPFS client
   * @param config Optional client configuration
   */
  constructor(config: Partial<IPFSClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = create({
      host: this.config.host,
      port: this.config.port,
      protocol: this.config.protocol,
      apiPath: this.config.apiPath,
      headers: this.config.headers,
    });
  }

  /**
   * Store data on IPFS
   * @param data The data to store (Buffer, string, or object)
   * @param options Storage options including encryption
   * @returns IPFS content information including CID
   */
  async storeData(
    data: Buffer | string | object,
    options: {
      encrypt?: boolean;
      encryptionKey?: string;
      pin?: boolean;
      name?: string;
    } = {}
  ): Promise<IPFSContent> {
    try {
      // Convert data to Buffer if it's not already
      let buffer: Buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data);
      } else {
        buffer = Buffer.from(JSON.stringify(data));
      }

      // Encrypt data if requested
      let encryptionKey: string | undefined;
      if (options.encrypt) {
        const encryptionResult = await encryptData(buffer, options.encryptionKey);
        buffer = encryptionResult.encryptedData;
        encryptionKey = encryptionResult.key;
      }

      // Add to IPFS
      const result = await this.client.add(buffer, {
        pin: options.pin !== false, // Pin by default
      });

      // Create metadata
      const content: IPFSContent = {
        cid: result.path,
        size: result.size,
        createdAt: Date.now(),
        pinned: options.pin !== false,
        encryptionKey,
      };

      // Add name as metadata if provided
      if (options.name) {
        await this.client.name.publish(result.path, { name: options.name });
      }

      return content;
    } catch (error) {
      console.error('Error storing data on IPFS:', error);
      throw new Error(`Failed to store data on IPFS: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve data from IPFS
   * @param cid Content identifier
   * @param options Retrieval options including decryption
   * @returns The retrieved data
   */
  async retrieveData(
    cid: string,
    options: {
      decrypt?: boolean;
      encryptionKey?: string;
      format?: 'buffer' | 'string' | 'json';
    } = {}
  ): Promise<Buffer | string | any> {
    try {
      // Get data from IPFS
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      // Combine chunks into a single buffer
      let buffer = Buffer.concat(chunks);

      // Decrypt if requested and encryption key is provided
      if (options.decrypt && options.encryptionKey) {
        buffer = await decryptData(buffer, options.encryptionKey);
      }

      // Return in requested format
      if (options.format === 'string') {
        return buffer.toString('utf-8');
      } else if (options.format === 'json') {
        return JSON.parse(buffer.toString('utf-8'));
      }
      return buffer;
    } catch (error) {
      console.error('Error retrieving data from IPFS:', error);
      throw new Error(`Failed to retrieve data from IPFS: ${(error as Error).message}`);
    }
  }

  /**
   * Pin content to ensure it persists in IPFS
   * @param cid Content identifier to pin
   * @returns Success status
   */
  async pinContent(cid: string): Promise<boolean> {
    try {
      await this.client.pin.add(cid);
      return true;
    } catch (error) {
      console.error('Error pinning content:', error);
      return false;
    }
  }

  /**
   * Unpin content from IPFS
   * @param cid Content identifier to unpin
   * @returns Success status
   */
  async unpinContent(cid: string): Promise<boolean> {
    try {
      await this.client.pin.rm(cid);
      return true;
    } catch (error) {
      console.error('Error unpinning content:', error);
      return false;
    }
  }

  /**
   * Check if content exists and is accessible
   * @param cid Content identifier to check
   * @returns Whether the content exists
   */
  async contentExists(cid: string): Promise<boolean> {
    try {
      // Attempt to get the stat for the CID
      await this.client.block.stat(cid);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all pinned content
   * @returns Array of pinned CIDs
   */
  async listPinnedContent(): Promise<string[]> {
    try {
      const pins = await this.client.pin.ls();
      const pinnedCids: string[] = [];

      for await (const pin of pins) {
        pinnedCids.push(pin.cid.toString());
      }

      return pinnedCids;
    } catch (error) {
      console.error('Error listing pinned content:', error);
      return [];
    }
  }
}

// Export a singleton instance with default configuration
export const ipfsClient = new IPFSClient();
