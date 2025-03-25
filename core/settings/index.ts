/**
 * System settings core module for BioDaptor
 * Exports configuration and settings services
 */

export * from './config';

// Re-export main config service instance for convenience
import { configService } from './config';
export default configService;
