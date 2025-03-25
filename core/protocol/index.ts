/**
 * Protocol core module for BioDaptor
 * Exports protocol registry and management services
 */

export * from './registry';
export * from './adapter-factory';

// Re-export main instances for convenience
import { protocolRegistry } from './registry';
import { protocolAdapterFactory } from './adapter-factory';

export {
  protocolRegistry,
  protocolAdapterFactory,
};

export default protocolRegistry;
