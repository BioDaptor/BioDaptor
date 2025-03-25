/**
 * Data core module for BioDaptor
 * Exports data indexing and management services
 */

export * from './genomic-index';

// Re-export main genomic index service instance for convenience
import { genomicIndexService } from './genomic-index';
export default genomicIndexService;
