/**
 * BioDaptor Protocol Adapters
 * Exports all protocol adapters that implement various protocols for BioDaptor
 */

// Export storage adapters
export * from './storage';

// Export storage adapters instance for direct access
import getIPFSAdapter from './storage';
export { getIPFSAdapter };

// Note: As more protocol adapters are implemented (computation, privacy, etc.),
// they should be exported from this file
