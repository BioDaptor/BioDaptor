/**
 * Authentication module for BioDaptor
 * Exports authentication services and utilities
 */

export * from './wallet-auth';
export * from './access-control';

// Re-export main instances for convenience
import { walletAuth } from './wallet-auth';
import { accessControlService } from './access-control';

export { walletAuth, accessControlService };
export default walletAuth;
