/**
 * Core protocol layer for BioDaptor
 * Exports all core protocol components
 */

// Export all core modules
export * from './auth';
export * from './data';
export * from './privacy';
export * from './value';
export * from './settings';
export * from './protocol';

// Re-export main service instances for convenience
import { walletAuth, accessControlService } from './auth';
import { genomicIndexService } from './data';
import { federatedComputingService } from './privacy';
import { valueDistributionService } from './value';
import { configService } from './settings';
import { protocolRegistry, protocolAdapterFactory } from './protocol';

export {
  walletAuth,
  accessControlService,
  genomicIndexService,
  federatedComputingService,
  valueDistributionService,
  configService,
  protocolRegistry,
  protocolAdapterFactory,
};
