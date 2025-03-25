/**
 * Protocol Registry for BioDaptor
 * Manages protocol definitions, versions, and metadata
 */

/**
 * Protocol type
 */
export enum ProtocolType {
  STORAGE = 'storage',
  COMPUTATION = 'computation',
  PRIVACY = 'privacy',
  CONSENSUS = 'consensus',
  DISTRIBUTION = 'distribution',
  DATA_FORMAT = 'dataFormat',
  IDENTITY = 'identity',
}

/**
 * Protocol status
 */
export enum ProtocolStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  RETIRED = 'retired',
}

/**
 * Protocol compatibility type
 */
export enum CompatibilityType {
  FULLY_COMPATIBLE = 'fullyCompatible',
  BACKWARD_COMPATIBLE = 'backwardCompatible',
  FORWARD_COMPATIBLE = 'forwardCompatible',
  NOT_COMPATIBLE = 'notCompatible',
}

/**
 * Protocol version
 */
export interface ProtocolVersion {
  version: string;
  releaseDate: number;
  status: ProtocolStatus;
  description: string;
  specificationUrl: string;
  implementationUrl?: string;
  changes?: string[];
  compatibility: Record<string, CompatibilityType>; // version -> compatibility
}

/**
 * Protocol definition
 */
export interface Protocol {
  id: string;
  name: string;
  type: ProtocolType;
  description: string;
  creator: string;
  maintainers: string[];
  repository?: string;
  documentation?: string;
  license: string;
  created: number;
  updated: number;
  currentVersion: string;
  versions: Record<string, ProtocolVersion>;
  tags: string[];
  dependencies?: Record<string, string>; // protocol id -> version
}

/**
 * Protocol search criteria
 */
export interface ProtocolSearchCriteria {
  type?: ProtocolType;
  status?: ProtocolStatus;
  creator?: string;
  maintainer?: string;
  tags?: string[];
  dependsOn?: string;
  minVersion?: string;
}

/**
 * Protocol registry interface
 */
export interface IProtocolRegistry {
  /**
   * Register a new protocol
   * @param protocol Protocol definition
   * @returns Registered protocol
   */
  registerProtocol(protocol: Omit<Protocol, 'created' | 'updated'>): Promise<Protocol>;

  /**
   * Add a new version to an existing protocol
   * @param protocolId Protocol ID
   * @param version Version details
   * @returns Updated protocol
   */
  addProtocolVersion(protocolId: string, version: ProtocolVersion): Promise<Protocol>;

  /**
   * Get a protocol by ID
   * @param protocolId Protocol ID
   * @returns Protocol or null if not found
   */
  getProtocol(protocolId: string): Promise<Protocol | null>;

  /**
   * Get a specific version of a protocol
   * @param protocolId Protocol ID
   * @param version Version string
   * @returns Protocol version or null if not found
   */
  getProtocolVersion(protocolId: string, version: string): Promise<ProtocolVersion | null>;

  /**
   * Update protocol metadata
   * @param protocolId Protocol ID
   * @param updates Protocol updates
   * @returns Updated protocol
   */
  updateProtocol(
    protocolId: string,
    updates: Partial<Omit<Protocol, 'id' | 'created' | 'updated' | 'versions'>>
  ): Promise<Protocol>;

  /**
   * Update protocol version metadata
   * @param protocolId Protocol ID
   * @param version Version string
   * @param updates Version updates
   * @returns Updated protocol
   */
  updateProtocolVersion(
    protocolId: string,
    version: string,
    updates: Partial<Omit<ProtocolVersion, 'version'>>
  ): Promise<Protocol>;

  /**
   * Change the status of a protocol version
   * @param protocolId Protocol ID
   * @param version Version string
   * @param status New status
   * @returns Updated protocol
   */
  changeVersionStatus(
    protocolId: string,
    version: string,
    status: ProtocolStatus
  ): Promise<Protocol>;

  /**
   * Set the current version of a protocol
   * @param protocolId Protocol ID
   * @param version Version string
   * @returns Updated protocol
   */
  setCurrentVersion(protocolId: string, version: string): Promise<Protocol>;

  /**
   * Search for protocols matching criteria
   * @param criteria Search criteria
   * @returns Matching protocols
   */
  searchProtocols(criteria: ProtocolSearchCriteria): Promise<Protocol[]>;

  /**
   * Check if two protocol versions are compatible
   * @param protocolId Protocol ID
   * @param version1 First version
   * @param version2 Second version
   * @returns Compatibility type
   */
  checkVersionCompatibility(
    protocolId: string,
    version1: string,
    version2: string
  ): Promise<CompatibilityType>;
}

/**
 * In-memory implementation of the protocol registry
 */
export class InMemoryProtocolRegistry implements IProtocolRegistry {
  private protocols: Map<string, Protocol> = new Map();

  /**
   * Register a new protocol
   * @param protocol Protocol definition
   * @returns Registered protocol
   */
  async registerProtocol(protocol: Omit<Protocol, 'created' | 'updated'>): Promise<Protocol> {
    if (this.protocols.has(protocol.id)) {
      throw new Error(`Protocol with ID ${protocol.id} already exists`);
    }

    // Validate required fields
    if (!protocol.name || !protocol.type || !protocol.description || !protocol.license) {
      throw new Error('Missing required protocol fields');
    }

    // Ensure at least one version exists and set as current
    if (!protocol.versions || Object.keys(protocol.versions).length === 0) {
      throw new Error('Protocol must have at least one version');
    }

    if (!protocol.currentVersion || !protocol.versions[protocol.currentVersion]) {
      throw new Error('Current version must exist in versions object');
    }

    const now = Date.now();
    const newProtocol: Protocol = {
      ...protocol,
      created: now,
      updated: now,
    };

    this.protocols.set(protocol.id, newProtocol);
    return newProtocol;
  }

  /**
   * Add a new version to an existing protocol
   * @param protocolId Protocol ID
   * @param version Version details
   * @returns Updated protocol
   */
  async addProtocolVersion(protocolId: string, version: ProtocolVersion): Promise<Protocol> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    // Check if version already exists
    if (protocol.versions[version.version]) {
      throw new Error(`Version ${version.version} already exists for protocol ${protocolId}`);
    }

    // Update protocol
    const updatedProtocol: Protocol = {
      ...protocol,
      versions: {
        ...protocol.versions,
        [version.version]: version,
      },
      updated: Date.now(),
    };

    this.protocols.set(protocolId, updatedProtocol);
    return updatedProtocol;
  }

  /**
   * Get a protocol by ID
   * @param protocolId Protocol ID
   * @returns Protocol or null if not found
   */
  async getProtocol(protocolId: string): Promise<Protocol | null> {
    return this.protocols.get(protocolId) || null;
  }

  /**
   * Get a specific version of a protocol
   * @param protocolId Protocol ID
   * @param version Version string
   * @returns Protocol version or null if not found
   */
  async getProtocolVersion(protocolId: string, version: string): Promise<ProtocolVersion | null> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      return null;
    }

    return protocol.versions[version] || null;
  }

  /**
   * Update protocol metadata
   * @param protocolId Protocol ID
   * @param updates Protocol updates
   * @returns Updated protocol
   */
  async updateProtocol(
    protocolId: string,
    updates: Partial<Omit<Protocol, 'id' | 'created' | 'updated' | 'versions'>>
  ): Promise<Protocol> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    const updatedProtocol: Protocol = {
      ...protocol,
      ...updates,
      // Preserve these fields
      id: protocol.id,
      created: protocol.created,
      versions: protocol.versions,
      updated: Date.now(),
    };

    this.protocols.set(protocolId, updatedProtocol);
    return updatedProtocol;
  }

  /**
   * Update protocol version metadata
   * @param protocolId Protocol ID
   * @param version Version string
   * @param updates Version updates
   * @returns Updated protocol
   */
  async updateProtocolVersion(
    protocolId: string,
    version: string,
    updates: Partial<Omit<ProtocolVersion, 'version'>>
  ): Promise<Protocol> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    const versionObj = protocol.versions[version];
    if (!versionObj) {
      throw new Error(`Version ${version} not found for protocol ${protocolId}`);
    }

    const updatedVersion: ProtocolVersion = {
      ...versionObj,
      ...updates,
      // Preserve version
      version: versionObj.version,
    };

    const updatedVersions = {
      ...protocol.versions,
      [version]: updatedVersion,
    };

    const updatedProtocol: Protocol = {
      ...protocol,
      versions: updatedVersions,
      updated: Date.now(),
    };

    this.protocols.set(protocolId, updatedProtocol);
    return updatedProtocol;
  }

  /**
   * Change the status of a protocol version
   * @param protocolId Protocol ID
   * @param version Version string
   * @param status New status
   * @returns Updated protocol
   */
  async changeVersionStatus(
    protocolId: string,
    version: string,
    status: ProtocolStatus
  ): Promise<Protocol> {
    return this.updateProtocolVersion(protocolId, version, { status });
  }

  /**
   * Set the current version of a protocol
   * @param protocolId Protocol ID
   * @param version Version string
   * @returns Updated protocol
   */
  async setCurrentVersion(protocolId: string, version: string): Promise<Protocol> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    if (!protocol.versions[version]) {
      throw new Error(`Version ${version} not found for protocol ${protocolId}`);
    }

    const updatedProtocol: Protocol = {
      ...protocol,
      currentVersion: version,
      updated: Date.now(),
    };

    this.protocols.set(protocolId, updatedProtocol);
    return updatedProtocol;
  }

  /**
   * Search for protocols matching criteria
   * @param criteria Search criteria
   * @returns Matching protocols
   */
  async searchProtocols(criteria: ProtocolSearchCriteria): Promise<Protocol[]> {
    let protocols = Array.from(this.protocols.values());

    // Apply filters
    if (criteria.type) {
      protocols = protocols.filter(p => p.type === criteria.type);
    }

    if (criteria.creator) {
      protocols = protocols.filter(p => p.creator === criteria.creator);
    }

    if (criteria.maintainer) {
      protocols = protocols.filter(p => p.maintainers.includes(criteria.maintainer!));
    }

    if (criteria.tags && criteria.tags.length > 0) {
      protocols = protocols.filter(p =>
        criteria.tags!.some(tag => p.tags.includes(tag))
      );
    }

    if (criteria.dependsOn) {
      protocols = protocols.filter(p =>
        p.dependencies && p.dependencies[criteria.dependsOn!]
      );
    }

    if (criteria.status) {
      protocols = protocols.filter(p =>
        Object.values(p.versions).some(v => v.status === criteria.status)
      );
    }

    if (criteria.minVersion) {
      protocols = protocols.filter(p => {
        // Simple semver-like comparison (major.minor.patch)
        const parts = p.currentVersion.split('.');
        const minParts = criteria.minVersion!.split('.');

        for (let i = 0; i < Math.min(parts.length, minParts.length); i++) {
          const partNum = parseInt(parts[i], 10);
          const minPartNum = parseInt(minParts[i], 10);

          if (partNum > minPartNum) return true;
          if (partNum < minPartNum) return false;
        }

        return parts.length >= minParts.length;
      });
    }

    return protocols;
  }

  /**
   * Check if two protocol versions are compatible
   * @param protocolId Protocol ID
   * @param version1 First version
   * @param version2 Second version
   * @returns Compatibility type
   */
  async checkVersionCompatibility(
    protocolId: string,
    version1: string,
    version2: string
  ): Promise<CompatibilityType> {
    const protocol = await this.getProtocol(protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID ${protocolId} not found`);
    }

    const v1 = protocol.versions[version1];
    const v2 = protocol.versions[version2];

    if (!v1 || !v2) {
      throw new Error(`One or both versions not found for protocol ${protocolId}`);
    }

    // Check if compatibility is explicitly defined
    if (v1.compatibility[version2]) {
      return v1.compatibility[version2];
    }

    if (v2.compatibility[version1]) {
      // Map reverse compatibility
      const reverseCompat = v2.compatibility[version1];

      switch (reverseCompat) {
        case CompatibilityType.FULLY_COMPATIBLE:
          return CompatibilityType.FULLY_COMPATIBLE;
        case CompatibilityType.BACKWARD_COMPATIBLE:
          return CompatibilityType.FORWARD_COMPATIBLE;
        case CompatibilityType.FORWARD_COMPATIBLE:
          return CompatibilityType.BACKWARD_COMPATIBLE;
        case CompatibilityType.NOT_COMPATIBLE:
          return CompatibilityType.NOT_COMPATIBLE;
      }
    }

    // If no explicit compatibility defined, use version number heuristic
    // Assuming semver-like versions (major.minor.patch)
    const v1Parts = version1.split('.').map(p => parseInt(p, 10));
    const v2Parts = version2.split('.').map(p => parseInt(p, 10));

    // If major versions differ, not compatible
    if (v1Parts[0] !== v2Parts[0]) {
      return CompatibilityType.NOT_COMPATIBLE;
    }

    // If minor versions same, fully compatible
    if (v1Parts[1] === v2Parts[1]) {
      return CompatibilityType.FULLY_COMPATIBLE;
    }

    // If older minor version, backward compatible (newer can read older)
    if (v1Parts[1] < v2Parts[1]) {
      return CompatibilityType.BACKWARD_COMPATIBLE;
    } else {
      return CompatibilityType.FORWARD_COMPATIBLE;
    }
  }
}

// Export a singleton instance
export const protocolRegistry = new InMemoryProtocolRegistry();
