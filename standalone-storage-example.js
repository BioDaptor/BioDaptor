/**
 * BioDaptor Storage Example (Standalone)
 * This is a simplified version of the storage example that doesn't require TypeScript compilation
 */

// Mock Protocol Registry
class ProtocolRegistry {
  constructor() {
    this.protocols = new Map();
  }

  async registerProtocol(protocol) {
    if (this.protocols.has(protocol.id)) {
      throw new Error(`Protocol with ID ${protocol.id} already exists`);
    }

    const now = Date.now();
    const newProtocol = {
      ...protocol,
      created: now,
      updated: now,
    };

    this.protocols.set(protocol.id, newProtocol);
    return newProtocol;
  }

  async getProtocol(protocolId) {
    return this.protocols.get(protocolId) || null;
  }

  async checkVersionCompatibility(protocolId, version1, version2) {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    const v1 = protocol.versions[version1];
    const v2 = protocol.versions[version2];

    if (!v1 || !v2) {
      throw new Error(`One or both versions not found for protocol ${protocolId}`);
    }

    // If compatibility is explicitly defined
    if (v1.compatibility[version2]) {
      return v1.compatibility[version2];
    }

    // Simple version comparison
    const v1Parts = version1.split('.').map(p => parseInt(p, 10));
    const v2Parts = version2.split('.').map(p => parseInt(p, 10));

    // If major versions differ, not compatible
    if (v1Parts[0] !== v2Parts[0]) {
      return 'notCompatible';
    }

    // If minor versions same, fully compatible
    if (v1Parts[1] === v2Parts[1]) {
      return 'fullyCompatible';
    }

    // If older minor version, backward compatible (newer can read older)
    if (v1Parts[1] < v2Parts[1]) {
      return 'backwardCompatible';
    } else {
      return 'forwardCompatible';
    }
  }
}

// Mock Protocol Adapter Factory
class ProtocolAdapterFactory {
  constructor() {
    this.adapters = new Map();
    this.adapterClasses = new Map();
  }

  registerAdapterClass(protocolId, adapterClass) {
    this.adapterClasses.set(protocolId, adapterClass);
  }

  async getAdapter(protocolId, version) {
    // Check if adapter is already created
    const adapterKey = this.getAdapterKey(protocolId, version);
    if (this.adapters.has(adapterKey)) {
      return this.adapters.get(adapterKey);
    }

    // Check if protocol exists
    const protocol = await protocolRegistry.getProtocol(protocolId);
    if (!protocol) {
      return null;
    }

    // Use specified version or current version
    const targetVersion = version || protocol.currentVersion;

    // Check if version exists
    if (!protocol.versions[targetVersion]) {
      return null;
    }

    // Check if adapter class is registered
    const adapterClass = this.adapterClasses.get(protocolId);
    if (!adapterClass) {
      return null;
    }

    // Create adapter instance
    try {
      const adapter = new adapterClass();

      // Initialize adapter
      await adapter.initialize({
        protocol,
        version: targetVersion,
      });

      // Store adapter instance
      this.adapters.set(adapterKey, adapter);

      return adapter;
    } catch (error) {
      console.error(`Failed to create adapter for ${protocolId}:${targetVersion}`, error);
      return null;
    }
  }

  getAdapterKey(protocolId, version) {
    return version ? `${protocolId}:${version}` : protocolId;
  }
}

// Mock Config Service
class ConfigService {
  constructor() {
    this.config = {
      storage: {
        defaultStorageProtocol: 'ipfs',
        encryptionEnabled: true,
        ipfsGateway: 'https://ipfs.io/ipfs',
        preferredPinningService: null,
      }
    };
  }

  getDomainConfig(domain) {
    return { ...this.config[domain] };
  }
}

// Constants
const ProtocolType = {
  STORAGE: 'storage',
  COMPUTATION: 'computation',
  PRIVACY: 'privacy',
  CONSENSUS: 'consensus',
  DISTRIBUTION: 'distribution',
  DATA_FORMAT: 'dataFormat',
  IDENTITY: 'identity',
};

const ProtocolStatus = {
  DRAFT: 'draft',
  PROPOSED: 'proposed',
  APPROVED: 'approved',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  RETIRED: 'retired',
};

const CompatibilityType = {
  FULLY_COMPATIBLE: 'fullyCompatible',
  BACKWARD_COMPATIBLE: 'backwardCompatible',
  FORWARD_COMPATIBLE: 'forwardCompatible',
  NOT_COMPATIBLE: 'notCompatible',
};

// Create instances
const protocolRegistry = new ProtocolRegistry();
const protocolAdapterFactory = new ProtocolAdapterFactory();
const configService = new ConfigService();

// IPFS Storage Adapter Implementation
class IPFSStorageAdapter {
  constructor() {
    this.protocol = null;
    this.version = '1.0.0';
    this.options = {
      gateway: 'https://ipfs.io/ipfs',
      timeout: 30000,
      encrypt: false,
      replicationFactor: 3
    };
    this.isInitialized = false;
    this.mockStorage = new Map();
  }

  async getProtocolDetails() {
    if (!this.protocol) {
      throw new Error('Adapter not initialized');
    }
    return this.protocol;
  }

  async implementsProtocol(protocolId, version) {
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

  async initialize(config) {
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

      // Set version
      if (this.protocol) {
        this.version = config.version || this.protocol.currentVersion;
      }

      // Get configuration from settings
      try {
        const storageConfig = configService.getDomainConfig('storage');

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

  async isAvailable() {
    return this.isInitialized;
  }

  async store(data, options) {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const storageOptions = {
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

  async retrieve(id, options) {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const retrievalOptions = {
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

  async delete(id, options) {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized');
    }

    // Merge default options with provided options
    const deletionOptions = {
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

  generateFakeCID() {
    const prefix = 'Qm';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;

    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}

// Function to get IPFS adapter
async function getIPFSAdapter() {
  return protocolAdapterFactory.getAdapter('ipfs-storage');
}

// Register IPFS adapter with the adapter factory
protocolAdapterFactory.registerAdapterClass('ipfs-storage', IPFSStorageAdapter);

// Register the IPFS protocol in the protocol registry
async function registerIPFSProtocol() {
  try {
    // Check if protocol already exists
    const existingProtocol = await protocolRegistry.getProtocol('ipfs-storage');

    if (existingProtocol) {
      console.log('✅ IPFS protocol already registered');
      return;
    }

    console.log('\n📝 Registering IPFS protocol...');

    // Register the protocol
    const timestamp = Date.now();
    await protocolRegistry.registerProtocol({
      id: 'ipfs-storage',
      name: 'IPFS Storage',
      type: ProtocolType.STORAGE,
      description: 'InterPlanetary File System (IPFS) distributed storage protocol',
      creator: 'BioDaptor',
      maintainers: ['BioDaptor Team'],
      repository: 'https://github.com/ipfs/ipfs',
      documentation: 'https://docs.ipfs.io',
      license: 'MIT',
      tags: ['storage', 'ipfs', 'distributed', 'content-addressed'],
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          releaseDate: timestamp,
          status: ProtocolStatus.ACTIVE,
          description: 'Initial IPFS storage adapter implementation',
          specificationUrl: 'https://ipfs.io/specs/',
          implementationUrl: 'https://github.com/ipfs/go-ipfs',
          changes: ['Initial release'],
          compatibility: {}
        }
      }
    });

    console.log('✅ IPFS protocol registered successfully');
  } catch (error) {
    console.error('Error registering IPFS protocol:', error);
    throw error;
  }
}

// Example of using the IPFS storage adapter
async function storageDemo() {
  try {
    console.log('🧬 BioDaptor IPFS Storage Adapter Demo');
    console.log('--------------------------------------');

    // Register the IPFS protocol in the registry
    await registerIPFSProtocol();

    // Get the IPFS adapter instance
    console.log('\n📥 Initializing IPFS adapter...');
    const ipfsAdapter = await getIPFSAdapter();

    if (!ipfsAdapter) {
      throw new Error('Failed to get IPFS adapter');
    }

    await ipfsAdapter.initialize({
      options: {
        gateway: 'https://ipfs.io/ipfs',
        encrypt: true
      }
    });

    console.log('✅ IPFS adapter initialized successfully');

    // Store some data
    console.log('\n📤 Storing genomic data on IPFS...');
    // Use TextEncoder to convert a string to a Uint8Array
    const encoder = new TextEncoder();
    const genomicData = encoder.encode('ATCGATCGTAGCTAGCTAGCTGATCGATGTACGTAGCTAG');
    const cid = await ipfsAdapter.store(genomicData, {
      replicationFactor: 5
    });

    console.log(`✅ Data stored successfully with CID: ${cid}`);

    // Retrieve the data
    console.log('\n📥 Retrieving genomic data from IPFS...');
    const retrievedData = await ipfsAdapter.retrieve(cid);
    // Use TextDecoder to convert a Uint8Array back to a string
    const decoder = new TextDecoder();
    const decodedData = decoder.decode(retrievedData);

    console.log(`✅ Data retrieved successfully: ${decodedData}`);

    // Delete the data
    console.log('\n🗑️ Deleting genomic data from IPFS...');
    const deleted = await ipfsAdapter.delete(cid);

    if (deleted) {
      console.log('✅ Data deleted successfully');
    } else {
      console.log('❌ Failed to delete data');
    }

    console.log('\n🎉 IPFS Storage Adapter Demo Completed');

  } catch (error) {
    console.error('Error in IPFS storage demo:', error);
  }
}

// Run the demo
storageDemo().catch(console.error);
