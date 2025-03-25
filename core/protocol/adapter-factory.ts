/**
 * Protocol Adapter Factory for BioDaptor
 * Provides dynamic loading and management of protocol adapters
 */

import { ProtocolType, Protocol, protocolRegistry } from './registry';

/**
 * Base protocol adapter interface
 */
export interface IProtocolAdapter {
  /**
   * Get the protocol details
   */
  getProtocolDetails(): Promise<Protocol>;

  /**
   * Check if this adapter implements a specific protocol
   * @param protocolId Protocol ID
   * @param version Version (optional, defaults to latest)
   */
  implementsProtocol(protocolId: string, version?: string): Promise<boolean>;

  /**
   * Initialize the adapter with configuration
   * @param config Configuration options
   */
  initialize(config: Record<string, any>): Promise<void>;

  /**
   * Check if adapter is ready and available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Storage protocol adapter interface
 */
export interface IStorageAdapter extends IProtocolAdapter {
  /**
   * Store data
   * @param data Data to store
   * @param options Storage options
   * @returns Identifier for the stored data
   */
  store(data: Uint8Array, options?: Record<string, any>): Promise<string>;

  /**
   * Retrieve data
   * @param id Data identifier
   * @param options Retrieval options
   * @returns Retrieved data
   */
  retrieve(id: string, options?: Record<string, any>): Promise<Uint8Array>;

  /**
   * Delete data
   * @param id Data identifier
   * @param options Deletion options
   * @returns Success status
   */
  delete(id: string, options?: Record<string, any>): Promise<boolean>;
}

/**
 * Computation protocol adapter interface
 */
export interface IComputationAdapter extends IProtocolAdapter {
  /**
   * Execute a computation
   * @param code Code to execute
   * @param inputs Input data
   * @param options Computation options
   * @returns Computation result
   */
  execute(code: string, inputs: Record<string, any>, options?: Record<string, any>): Promise<any>;

  /**
   * Get supported computation languages/frameworks
   * @returns List of supported languages/frameworks
   */
  getSupportedLanguages(): Promise<string[]>;
}

/**
 * Privacy protocol adapter interface
 */
export interface IPrivacyAdapter extends IProtocolAdapter {
  /**
   * Apply privacy-preserving transformation
   * @param data Data to transform
   * @param privacyBudget Privacy budget to use
   * @param options Privacy options
   * @returns Transformed data
   */
  applyPrivacy(data: any, privacyBudget: number, options?: Record<string, any>): Promise<any>;

  /**
   * Get remaining privacy budget
   * @returns Remaining privacy budget
   */
  getRemainingBudget(): Promise<number>;
}

/**
 * Consensus protocol adapter interface
 */
export interface IConsensusAdapter extends IProtocolAdapter {
  /**
   * Propose a value for consensus
   * @param value Value to propose
   * @param context Consensus context
   * @returns Proposal ID
   */
  propose(value: any, context: string): Promise<string>;

  /**
   * Vote on a proposal
   * @param proposalId Proposal ID
   * @param vote Vote value
   * @returns Success status
   */
  vote(proposalId: string, vote: boolean): Promise<boolean>;

  /**
   * Get the consensus result
   * @param proposalId Proposal ID
   * @returns Consensus result or null if not reached
   */
  getResult(proposalId: string): Promise<any | null>;
}

/**
 * Distribution protocol adapter interface
 */
export interface IDistributionAdapter extends IProtocolAdapter {
  /**
   * Create a distribution plan
   * @param totalValue Total value to distribute
   * @param contributors Contributors and their contributions
   * @param options Distribution options
   * @returns Distribution plan
   */
  createDistributionPlan(
    totalValue: number,
    contributors: Record<string, number>,
    options?: Record<string, any>
  ): Promise<Record<string, number>>;

  /**
   * Execute a distribution
   * @param distributionPlan Distribution plan
   * @param options Execution options
   * @returns Transaction details
   */
  executeDistribution(
    distributionPlan: Record<string, number>,
    options?: Record<string, any>
  ): Promise<any>;
}

/**
 * Data format protocol adapter interface
 */
export interface IDataFormatAdapter extends IProtocolAdapter {
  /**
   * Parse data from format
   * @param data Data in the format
   * @param options Parsing options
   * @returns Parsed data
   */
  parse(data: Uint8Array, options?: Record<string, any>): Promise<any>;

  /**
   * Serialize data to format
   * @param data Data to serialize
   * @param options Serialization options
   * @returns Serialized data
   */
  serialize(data: any, options?: Record<string, any>): Promise<Uint8Array>;

  /**
   * Validate data against format
   * @param data Data to validate
   * @param options Validation options
   * @returns Validation result
   */
  validate(data: any, options?: Record<string, any>): Promise<boolean>;
}

/**
 * Identity protocol adapter interface
 */
export interface IIdentityAdapter extends IProtocolAdapter {
  /**
   * Verify identity
   * @param identity Identity data
   * @param proof Proof of identity
   * @param options Verification options
   * @returns Verification result
   */
  verifyIdentity(identity: any, proof: any, options?: Record<string, any>): Promise<boolean>;

  /**
   * Generate identity proof
   * @param identity Identity data
   * @param options Generation options
   * @returns Identity proof
   */
  generateProof(identity: any, options?: Record<string, any>): Promise<any>;
}

/**
 * Adapter factory to create and manage protocol adapters
 */
export class ProtocolAdapterFactory {
  private adapters: Map<string, IProtocolAdapter> = new Map();
  private adapterClasses: Map<string, new (...args: any[]) => IProtocolAdapter> = new Map();

  /**
   * Register an adapter class for a protocol
   * @param protocolId Protocol ID
   * @param adapterClass Adapter class
   */
  registerAdapterClass(
    protocolId: string,
    adapterClass: new (...args: any[]) => IProtocolAdapter
  ): void {
    this.adapterClasses.set(protocolId, adapterClass);
  }

  /**
   * Get an adapter for a protocol
   * @param protocolId Protocol ID
   * @param version Protocol version (optional, defaults to latest)
   * @returns Protocol adapter
   */
  async getAdapter<T extends IProtocolAdapter>(
    protocolId: string,
    version?: string
  ): Promise<T | null> {
    // Check if adapter is already created
    const adapterKey = this.getAdapterKey(protocolId, version);
    if (this.adapters.has(adapterKey)) {
      return this.adapters.get(adapterKey) as T;
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

      return adapter as T;
    } catch (error) {
      console.error(`Failed to create adapter for ${protocolId}:${targetVersion}`, error);
      return null;
    }
  }

  /**
   * Get an adapter for a protocol type
   * @param type Protocol type
   * @param preferredId Preferred protocol ID (optional)
   * @returns Best matching protocol adapter
   */
  async getAdapterByType<T extends IProtocolAdapter>(
    type: ProtocolType,
    preferredId?: string
  ): Promise<T | null> {
    // If preferred ID is specified, try to get that adapter first
    if (preferredId) {
      const preferredAdapter = await this.getAdapter<T>(preferredId);
      if (preferredAdapter) {
        return preferredAdapter;
      }
    }

    // Search for protocols of the specified type
    const protocols = await protocolRegistry.searchProtocols({ type });

    // No protocols of the specified type
    if (protocols.length === 0) {
      return null;
    }

    // Try to find an active protocol
    const activeProtocols = protocols.filter(p => {
      const currentVersion = p.versions[p.currentVersion];
      return currentVersion.status === 'active';
    });

    // Prioritize active protocols
    const targetProtocols = activeProtocols.length > 0 ? activeProtocols : protocols;

    // Try each protocol until finding one with a registered adapter
    for (const protocol of targetProtocols) {
      const adapter = await this.getAdapter<T>(protocol.id);
      if (adapter) {
        return adapter;
      }
    }

    return null;
  }

  /**
   * Remove an adapter instance
   * @param protocolId Protocol ID
   * @param version Protocol version (optional)
   * @returns Success status
   */
  removeAdapter(protocolId: string, version?: string): boolean {
    const adapterKey = this.getAdapterKey(protocolId, version);
    return this.adapters.delete(adapterKey);
  }

  /**
   * Get all registered adapter instances
   * @returns All adapter instances
   */
  getAllAdapters(): IProtocolAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get unique key for storing adapters
   */
  private getAdapterKey(protocolId: string, version?: string): string {
    return version ? `${protocolId}:${version}` : protocolId;
  }
}

// Export a singleton instance
export const protocolAdapterFactory = new ProtocolAdapterFactory();
