/**
 * IPFS Storage Adapter for BioDaptor
 * Implements the storage protocol adapter for IPFS
 */

import {
  IStorageAdapter,
  Protocol,
  protocolRegistry,
  ProtocolType,
  ProtocolStatus,
  CompatibilityType
} from '@core/protocol';
import { configService, ConfigDomain } from '@core/settings';

/**
 * IPFS storage options
 */
export interface IPFSStorageOptions {
  gateway?: string;
  pinningService?: string;
  timeout?: number;
  encrypt?: boolean;
  replicationFactor?: number;
}

/**
 * Mock implementation of IPFS storage adapter
 * Note: This is a simulation for demonstration purposes
 */
export class IPFSStorageAdapter implements IStorageAdapter {
  private protocol: Protocol | null = null;
  private version: string = '1.0.0';
  private options: IPFSStorageOptions = {
    gateway: 'https://ipfs.io/ipfs',
    timeout: 30000,
    encrypt: false,
    replicationFactor: 3
  };
  private isInitialized: boolean = false;
  private mockStorage: Map<string, Uint8Array> = new Map();

  /**
   * Get the protocol details
   */
  async getProtocolDetails(): Promise<Protocol> {
    if (!this.protocol) {
      throw new Error('Adapter not initialized');
    }
    return this.protocol;
  }

  /**
   * Check if this adapter implements a specific protocol
   * @param protocolId Protocol ID
   * @param version Version (optional, defaults to latest)
   */
  async implementsProtocol(protocolId: string, version?: string): Promise<boolean> {
    if (!this.protocol) {
      return false;
    }

    if (this.protocol.id !== protocolId) {
      return false;
    }

    if (version && this.version !== version) {
      // Check compatibility
      const compatibility = await protocolRegistry.checkVersionCompatibility(
        protocolId,
        this.version,
        version
      );

      return compatibility !== CompatibilityType.NOT_COMPATIBLE;
    }

    return true;
  }

  /**
   * Initialize the adapter with configuration
   * @param config Configuration options
   */
  async initialize(config: Record<string, any>): Promise<void> {
    try {
      // Get protocol details from config
      if (config.protocol) {
        this.protocol = config.protocol;
      } else {
        // Look up the protocol in the registry
        const protocol = await protocolRegistry.getProtocol('ipfs-storage');

        if (!protocol) {
          console.warn('IPFS storage protocol not found in registry, using default protocol settings');
          // Create a minimal default protocol object if not found
          const timestamp = Date.now();
          this.protocol = {
            id: 'ipfs-storage',
            name: 'IPFS Storage',
            type: ProtocolType.STORAGE,
            description: 'IPFS distributed storage protocol',
            license: 'MIT',
            created: timestamp,
            updated: timestamp,
            creator: 'BioDaptor',
            maintainers: ['BioDaptor Team'],
            tags: ['storage', 'ipfs', 'distributed'],
            versions: {
              '1.0.0': {
                version: '1.0.0',
                status: ProtocolStatus.ACTIVE,
                releaseDate: timestamp,
                description: 'Initial IPFS storage adapter implementation',
                specificationUrl: 'https://ipfs.io/specs/',
                compatibility: {},
              }
            },
            currentVersion: '1.0.0'
          };
        } else {
          this.protocol = protocol;
        }
      }

      // Set version - now guaranteed to have a protocol
      if (this.protocol) {
        this.version = config.version || this.protocol.currentVersion;
      }

      // Get configuration from settings
      try {
        const storageConfig = configService.getDomainConfig(ConfigDomain.STORAGE);

        if (storageConfig) {
          this.options = {
            ...this.options,
            gateway: storageConfig.ipfsGateway || this.options.gateway,
            pinningService: storageConfig.preferredPinningService || this.options.pinningService,
            encrypt: storageConfig.encryptionEnabled !== undefined ?
              storageConfig.encryptionEnabled : this.options.encrypt,
          };
        }
      } catch (configError) {
        console.warn('Could not load storage configuration, using defaults', configError);
      }

      // Override with provided options
      if (config.options) {
        this.options = {
          ...this.options,
          ...config.options,
        };
      }

      this.isInitialized = true;

      console.log(`IPFS adapter initialized with gateway: ${this.options.gateway}`);
    } catch (error) {
      console.error('IPFS adapter initialization failed:', error);
      throw new Error(`Failed to initialize IPFS adapter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if adapter is ready and available
   */
  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Store data on IPFS
   * @param data Data to store
   * @param options Storage options
   * @returns IPFS CID
   */
  async store(data: Uint8Array, options?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const storageOptions: IPFSStorageOptions = {
      ...this.options,
      ...options,
    };

    // In a real implementation, this would call the IPFS API
    // For this mock implementation, we'll generate a fake CID
    const cid = this.generateFakeCID();

    // Store in our mock storage
    this.mockStorage.set(cid, data);

    console.log(`Stored ${data.byteLength} bytes with CID: ${cid}`);
    console.log(`Using gateway: ${storageOptions.gateway}`);

    if (storageOptions.encrypt) {
      console.log('Data was encrypted before storage');
    }

    return cid;
  }

  /**
   * Retrieve data from IPFS
   * @param id IPFS CID
   * @param options Retrieval options
   * @returns Retrieved data
   */
  async retrieve(id: string, options?: Record<string, any>): Promise<Uint8Array> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const retrievalOptions: IPFSStorageOptions = {
      ...this.options,
      ...options,
    };

    // In a real implementation, this would call the IPFS API
    // For this mock implementation, we'll retrieve from our mock storage
    const data = this.mockStorage.get(id);

    if (!data) {
      throw new Error(`Data with CID ${id} not found`);
    }

    console.log(`Retrieved ${data.byteLength} bytes from CID: ${id}`);
    console.log(`Using gateway: ${retrievalOptions.gateway}`);

    if (retrievalOptions.encrypt) {
      console.log('Data was decrypted after retrieval');
    }

    return data;
  }

  /**
   * Delete data from IPFS
   * @param id IPFS CID
   * @param options Deletion options
   * @returns Success status
   */
  async delete(id: string, options?: Record<string, any>): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const deletionOptions: IPFSStorageOptions = {
      ...this.options,
      ...options,
    };

    // In a real implementation, this would unpin the data from IPFS
    // For this mock implementation, we'll remove from our mock storage
    const exists = this.mockStorage.has(id);

    if (!exists) {
      return false;
    }

    this.mockStorage.delete(id);

    console.log(`Deleted CID: ${id}`);
    console.log(`Using pinning service: ${deletionOptions.pinningService}`);

    return true;
  }

  /**
   * Generate a fake CID for mock implementation
   * @returns Fake CID
   */
  private generateFakeCID(): string {
    const prefix = 'Qm';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;

    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}

// Factory function to create the adapter
export function createIPFSAdapter(): IStorageAdapter {
  return new IPFSStorageAdapter();
}
