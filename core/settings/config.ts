/**
 * System Configuration Service for BioDaptor
 * Provides centralized configuration management for all modules
 */

// Add Node.js type definitions for process.env
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV?: string;
    ENVIRONMENT_NAME?: string;
    VERSION?: string;
    API_BASE_URL?: string;
    LOG_LEVEL?: string;
    IPFS_GATEWAY?: string;
    PINNING_SERVICE?: string;
    DEFAULT_NETWORK?: string;
  }
};

/**
 * Configuration domains
 */
export enum ConfigDomain {
  SYSTEM = 'system',
  STORAGE = 'storage',
  PRIVACY = 'privacy',
  VALUE = 'value',
  AUTH = 'auth',
  BLOCKCHAIN = 'blockchain',
}

/**
 * Configuration options
 */
export interface SystemConfig {
  [ConfigDomain.SYSTEM]: {
    environmentName: string;
    version: string;
    developmentMode: boolean;
    apiBaseUrl: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  [ConfigDomain.STORAGE]: {
    defaultStorageProtocol: 'ipfs' | 'filecoin' | 'arweave';
    encryptionEnabled: boolean;
    ipfsGateway: string;
    preferredPinningService?: string;
  };
  [ConfigDomain.PRIVACY]: {
    defaultPrivacyMode: 'federated' | 'mpc' | 'tee';
    maximumPrivacyBudget: number;
    allowedAlgorithms: string[];
  };
  [ConfigDomain.VALUE]: {
    defaultTokenSymbol: string;
    defaultDistributionModel: string;
    minimumContributionThreshold: number;
  };
  [ConfigDomain.AUTH]: {
    sessionTimeoutMinutes: number;
    allowedWalletTypes: string[];
    requireEmailVerification: boolean;
  };
  [ConfigDomain.BLOCKCHAIN]: {
    defaultNetwork: string;
    defaultChain: 'solana' | 'ethereum' | 'other';
    requiredConfirmations: number;
  };
}

// Helper type for domain-specific config
type DomainConfig<T extends ConfigDomain> = SystemConfig[T];

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: SystemConfig = {
  [ConfigDomain.SYSTEM]: {
    environmentName: process.env.ENVIRONMENT_NAME || 'development',
    version: process.env.VERSION || '0.1.0',
    developmentMode: process.env.NODE_ENV !== 'production',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },
  [ConfigDomain.STORAGE]: {
    defaultStorageProtocol: 'ipfs',
    encryptionEnabled: true,
    ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs',
    preferredPinningService: process.env.PINNING_SERVICE,
  },
  [ConfigDomain.PRIVACY]: {
    defaultPrivacyMode: 'federated',
    maximumPrivacyBudget: 1.0,
    allowedAlgorithms: ['average', 'count', 'sum', 'linearRegression', 'decisionTree'],
  },
  [ConfigDomain.VALUE]: {
    defaultTokenSymbol: 'BDP',
    defaultDistributionModel: 'proportional',
    minimumContributionThreshold: 0.01,
  },
  [ConfigDomain.AUTH]: {
    sessionTimeoutMinutes: 60,
    allowedWalletTypes: ['solana', 'ethereum'],
    requireEmailVerification: false,
  },
  [ConfigDomain.BLOCKCHAIN]: {
    defaultNetwork: process.env.DEFAULT_NETWORK || 'devnet',
    defaultChain: 'solana',
    requiredConfirmations: process.env.NODE_ENV === 'production' ? 32 : 1,
  },
};

/**
 * Helper functions for deep cloning specific config domains
 */
function cloneDomainConfig<T extends ConfigDomain>(domain: T, config: SystemConfig): SystemConfig[T] {
  const source = config[domain];
  // @ts-ignore - We know this is the correct type
  return structuredClone ?
    structuredClone(source) :
    JSON.parse(JSON.stringify(source));
}

function cloneFullConfig(config: SystemConfig): SystemConfig {
  // @ts-ignore - We know this is the correct type
  return structuredClone ?
    structuredClone(config) :
    JSON.parse(JSON.stringify(config));
}

/**
 * System configuration service
 */
export class ConfigService {
  private config: SystemConfig;
  private configListeners: Map<string, Array<(value: any) => void>> = new Map();

  constructor(initialConfig: Partial<SystemConfig> = {}) {
    // Deep merge default config with provided config
    this.config = this.mergeConfigs(DEFAULT_CONFIG, initialConfig);
  }

  /**
   * Get entire configuration
   */
  getFullConfig(): SystemConfig {
    return cloneFullConfig(this.config);
  }

  /**
   * Get configuration for a specific domain
   * @param domain Configuration domain
   */
  getDomainConfig<T extends ConfigDomain>(domain: T): DomainConfig<T> {
    return cloneDomainConfig(domain, this.config);
  }

  /**
   * Get a specific configuration value
   * @param domain Configuration domain
   * @param key Configuration key
   */
  getValue<T extends ConfigDomain, K extends keyof SystemConfig[T]>(
    domain: T,
    key: K
  ): SystemConfig[T][K] {
    return this.config[domain][key];
  }

  /**
   * Update a configuration value
   * @param domain Configuration domain
   * @param key Configuration key
   * @param value New value
   */
  updateValue<T extends ConfigDomain, K extends keyof SystemConfig[T]>(
    domain: T,
    key: K,
    value: SystemConfig[T][K]
  ): void {
    this.config[domain][key] = value;

    // Notify listeners
    this.notifyListeners(`${domain}.${String(key)}`, value);
  }

  /**
   * Update an entire domain's configuration
   * @param domain Configuration domain
   * @param config New domain configuration
   */
  updateDomainConfig<T extends ConfigDomain>(domain: T, config: Partial<DomainConfig<T>>): void {
    const domainConfig = cloneDomainConfig(domain, this.config);

    // @ts-ignore - We know these types are compatible
    this.config[domain] = {
      ...domainConfig,
      ...config,
    };

    // Notify domain listeners
    this.notifyListeners(domain, this.config[domain]);
  }

  /**
   * Reset configuration to defaults
   * @param domain Optional domain to reset (resets all if not provided)
   */
  resetToDefaults(domain?: ConfigDomain): void {
    if (domain) {
      // @ts-ignore - We know the types are compatible
      this.config[domain] = cloneDomainConfig(domain, DEFAULT_CONFIG);
      this.notifyListeners(domain, this.config[domain]);
    } else {
      // @ts-ignore - We know the types are compatible
      this.config = cloneFullConfig(DEFAULT_CONFIG);
      for (const d of Object.values(ConfigDomain)) {
        this.notifyListeners(d, this.config[d]);
      }
    }
  }

  /**
   * Subscribe to configuration changes
   * @param path Path to watch (domain or domain.key)
   * @param callback Callback to execute on change
   * @returns Unsubscribe function
   */
  subscribe(path: string, callback: (value: any) => void): () => void {
    if (!this.configListeners.has(path)) {
      this.configListeners.set(path, []);
    }

    this.configListeners.get(path)!.push(callback);

    return () => {
      const listeners = this.configListeners.get(path);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Helper to merge configs deeply
   */
  private mergeConfigs(defaultConfig: SystemConfig, overrideConfig: Partial<SystemConfig>): SystemConfig {
    const result = cloneFullConfig(defaultConfig);

    for (const domain of Object.values(ConfigDomain)) {
      if (overrideConfig[domain]) {
        // @ts-ignore - We know these types are compatible
        result[domain] = {
          ...result[domain],
          ...overrideConfig[domain],
        };
      }
    }

    return result;
  }

  /**
   * Notify listeners of config changes
   */
  private notifyListeners(path: string, value: any): void {
    // Notify specific path listeners
    const listeners = this.configListeners.get(path);
    if (listeners) {
      for (const listener of listeners) {
        listener(value);
      }
    }

    // If this is a domain.key path, also notify domain listeners
    if (path.includes('.')) {
      const [domain] = path.split('.');
      const domainListeners = this.configListeners.get(domain);
      if (domainListeners) {
        for (const listener of domainListeners) {
          listener(this.config[domain as ConfigDomain]);
        }
      }
    }
  }
}

// Export a singleton instance
export const configService = new ConfigService();
