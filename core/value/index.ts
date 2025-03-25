/**
 * Value distribution core module for BioDaptor
 * Exports value distribution services and utilities
 */

export * from './distribution';

// Re-export main value distribution service instance for convenience
import { valueDistributionService } from './distribution';
export default valueDistributionService;
