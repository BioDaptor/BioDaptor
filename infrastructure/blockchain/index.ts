/**
 * Blockchain Infrastructure module for BioDaptor
 * Exports blockchain clients and utilities
 */

export * from './solana';

// Re-export main client instance for convenience
import { solanaClient } from './solana';
export default solanaClient;
