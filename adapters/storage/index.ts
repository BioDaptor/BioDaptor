/**
 * BioDaptor Storage Adapters
 * Exports the storage protocol adapters that implement various storage protocols
 */

import { protocolAdapterFactory } from '@core/protocol';
import { IPFSStorageAdapter, createIPFSAdapter } from './ipfs-adapter';

// Register IPFS adapter with the adapter factory
protocolAdapterFactory.registerAdapterClass('ipfs-storage', IPFSStorageAdapter);

// Export adapters for direct usage
export {
  IPFSStorageAdapter,
  createIPFSAdapter
};

// Export default function to get IPFS adapter instance
export default function getIPFSAdapter() {
  return protocolAdapterFactory.getAdapter('ipfs-storage');
}
