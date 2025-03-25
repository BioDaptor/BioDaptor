/**
 * Genomic Data Indexing for BioDaptor
 * Provides functionality to index and search genomic datasets
 */

import { GenomicDataset, GenomicDataType, Pagination, PaginatedResponse } from '@shared/types';

/**
 * Search criteria for genomic datasets
 */
export interface GenomicSearchCriteria {
  owner?: string;
  dataType?: GenomicDataType;
  minQuality?: number;
  isPublic?: boolean;
  keywords?: string[];
  accessibleBy?: string;
  createdAfter?: number;
  createdBefore?: number;
}

/**
 * Sorting options for genomic datasets
 */
export type GenomicSortField = 'createdAt' | 'updatedAt' | 'quality' | 'usageCount';

/**
 * Sorting direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Interface for genomic data indexing service
 */
export interface IGenomicIndexService {
  /**
   * Add a genomic dataset to the index
   * @param dataset The dataset to index
   * @returns The indexed dataset with assigned ID
   */
  indexDataset(dataset: Omit<GenomicDataset, 'id'>): Promise<GenomicDataset>;

  /**
   * Update an indexed genomic dataset
   * @param id Dataset ID
   * @param updates Updates to apply
   * @returns The updated dataset
   */
  updateDataset(id: string, updates: Partial<GenomicDataset>): Promise<GenomicDataset>;

  /**
   * Remove a dataset from the index
   * @param id Dataset ID
   * @returns Success status
   */
  removeDataset(id: string): Promise<boolean>;

  /**
   * Get a dataset by ID
   * @param id Dataset ID
   * @returns The dataset or null if not found
   */
  getDataset(id: string): Promise<GenomicDataset | null>;

  /**
   * Search for datasets matching criteria
   * @param criteria Search criteria
   * @param pagination Pagination options
   * @param sort Sorting options
   * @returns Paginated datasets matching criteria
   */
  searchDatasets(
    criteria: GenomicSearchCriteria,
    pagination: Pagination,
    sort?: { field: GenomicSortField; direction: SortDirection }
  ): Promise<PaginatedResponse<GenomicDataset>>;
}

/**
 * In-memory implementation of genomic indexing service (for MVP)
 */
export class InMemoryGenomicIndexService implements IGenomicIndexService {
  private datasets: Map<string, GenomicDataset> = new Map();
  private nextId: number = 1;

  /**
   * Add a genomic dataset to the index
   * @param dataset The dataset to index
   * @returns The indexed dataset with assigned ID
   */
  async indexDataset(dataset: Omit<GenomicDataset, 'id'>): Promise<GenomicDataset> {
    const id = `genomic-${this.nextId++}`;
    const now = Date.now();

    const indexedDataset: GenomicDataset = {
      ...dataset,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.datasets.set(id, indexedDataset);
    return indexedDataset;
  }

  /**
   * Update an indexed genomic dataset
   * @param id Dataset ID
   * @param updates Updates to apply
   * @returns The updated dataset
   */
  async updateDataset(id: string, updates: Partial<GenomicDataset>): Promise<GenomicDataset> {
    const dataset = this.datasets.get(id);

    if (!dataset) {
      throw new Error(`Dataset with ID ${id} not found`);
    }

    const updatedDataset: GenomicDataset = {
      ...dataset,
      ...updates,
      id, // Ensure ID isn't changed
      updatedAt: Date.now(),
    };

    this.datasets.set(id, updatedDataset);
    return updatedDataset;
  }

  /**
   * Remove a dataset from the index
   * @param id Dataset ID
   * @returns Success status
   */
  async removeDataset(id: string): Promise<boolean> {
    return this.datasets.delete(id);
  }

  /**
   * Get a dataset by ID
   * @param id Dataset ID
   * @returns The dataset or null if not found
   */
  async getDataset(id: string): Promise<GenomicDataset | null> {
    return this.datasets.get(id) || null;
  }

  /**
   * Search for datasets matching criteria
   * @param criteria Search criteria
   * @param pagination Pagination options
   * @param sort Sorting options
   * @returns Paginated datasets matching criteria
   */
  async searchDatasets(
    criteria: GenomicSearchCriteria,
    pagination: Pagination,
    sort?: { field: GenomicSortField; direction: SortDirection }
  ): Promise<PaginatedResponse<GenomicDataset>> {
    // Convert map to array for filtering
    let datasets = Array.from(this.datasets.values());

    // Apply filters based on criteria
    if (criteria.owner) {
      datasets = datasets.filter(d => d.owner === criteria.owner);
    }

    if (criteria.dataType) {
      datasets = datasets.filter(d => d.metadata.dataType === criteria.dataType);
    }

    if (criteria.minQuality !== undefined) {
      datasets = datasets.filter(d => d.metadata.quality >= criteria.minQuality);
    }

    if (criteria.isPublic !== undefined) {
      datasets = datasets.filter(d => d.accessControl.isPublic === criteria.isPublic);
    }

    if (criteria.accessibleBy) {
      datasets = datasets.filter(
        d => d.accessControl.isPublic || d.accessControl.authorizedUsers.includes(criteria.accessibleBy!)
      );
    }

    if (criteria.createdAfter) {
      datasets = datasets.filter(d => d.createdAt >= criteria.createdAfter!);
    }

    if (criteria.createdBefore) {
      datasets = datasets.filter(d => d.createdAt <= criteria.createdBefore!);
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
      datasets = datasets.filter(d => {
        const lowerDescription = d.metadata.description.toLowerCase();
        return criteria.keywords!.some(keyword =>
          lowerDescription.includes(keyword.toLowerCase())
        );
      });
    }

    // Apply sorting
    if (sort) {
      datasets.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        // Get the values to compare based on sort field
        switch (sort.field) {
          case 'createdAt':
            valueA = a.createdAt;
            valueB = b.createdAt;
            break;
          case 'updatedAt':
            valueA = a.updatedAt;
            valueB = b.updatedAt;
            break;
          case 'quality':
            valueA = a.metadata.quality;
            valueB = b.metadata.quality;
            break;
          case 'usageCount':
            valueA = a.valueMetrics.usageCount;
            valueB = b.valueMetrics.usageCount;
            break;
          default:
            valueA = a.createdAt;
            valueB = b.createdAt;
        }

        // Apply sorting direction
        const direction = sort.direction === 'asc' ? 1 : -1;
        return (valueA > valueB ? 1 : valueA < valueB ? -1 : 0) * direction;
      });
    } else {
      // Default sort by createdAt descending
      datasets.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Apply pagination
    const total = datasets.length;
    const start = pagination.offset;
    const end = pagination.offset + pagination.limit;
    const paginatedItems = datasets.slice(start, end);

    return {
      items: paginatedItems,
      pagination: {
        offset: pagination.offset,
        limit: pagination.limit,
        total,
      },
    };
  }
}

// Export a singleton instance
export const genomicIndexService = new InMemoryGenomicIndexService();
