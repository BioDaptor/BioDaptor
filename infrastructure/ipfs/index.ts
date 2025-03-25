/**
 * IPFS Infrastructure module for BioDaptor
 * Exports IPFS client and encryption utilities
 */

export * from './client';
export * from './encryption';

// Re-export main client instance for convenience
import { ipfsClient } from './client';
export default ipfsClient;
