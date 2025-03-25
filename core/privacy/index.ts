/**
 * Privacy core module for BioDaptor
 * Exports privacy-preserving computing services
 */

export * from './federated-computing';

// Re-export main federated computing service instance for convenience
import { federatedComputingService } from './federated-computing';
export default federatedComputingService;
