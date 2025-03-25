/**
 * Value Distribution System for BioDaptor
 * Manages the fair distribution of value among contributors
 */

import crypto from 'crypto';

/**
 * Types of value distribution models
 */
export enum DistributionModelType {
  EQUAL = 'equal',          // Equal distribution to all contributors
  PROPORTIONAL = 'proportional', // Distribution proportional to contribution
  WEIGHTEDRANK = 'weightedRank', // Distribution based on ranked importance
  MILESTONE = 'milestone',   // Distribution based on milestone completion
  CUSTOM = 'custom',        // Custom distribution formula
}

/**
 * Status of a distribution
 */
export enum DistributionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Contribution record for value distribution
 */
export interface Contribution {
  contributorId: string;
  contributionType: string;
  value: number; // Relative value or weight of the contribution
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Distribution configuration
 */
export interface DistributionConfig {
  modelType: DistributionModelType;
  totalAmount: number;
  tokenSymbol: string;
  minContribution?: number;
  customWeights?: Record<string, number>;
  parameters?: Record<string, any>;
}

/**
 * A single distribution transaction
 */
export interface DistributionTransaction {
  id: string;
  recipientId: string;
  amount: number;
  tokenSymbol: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

/**
 * Complete value distribution
 */
export interface ValueDistribution {
  id: string;
  config: DistributionConfig;
  contributions: Contribution[];
  transactions: DistributionTransaction[];
  status: DistributionStatus;
  initiatedBy: string;
  initiatedAt: number;
  completedAt?: number;
  error?: string;
}

/**
 * Value distribution allocation result
 */
export interface DistributionAllocation {
  contributorId: string;
  amount: number;
  percentage: number;
  contributionCount: number;
  contributionValue: number;
}

/**
 * Interface for value distribution service
 */
export interface IValueDistributionService {
  /**
   * Create a new value distribution
   * @param config Distribution configuration
   * @param contributions List of contributions
   * @param initiatorId ID of user initiating the distribution
   * @returns Created value distribution
   */
  createDistribution(
    config: DistributionConfig,
    contributions: Contribution[],
    initiatorId: string
  ): Promise<ValueDistribution>;

  /**
   * Process a pending distribution
   * @param id Distribution ID
   * @returns Updated distribution
   */
  processDistribution(id: string): Promise<ValueDistribution>;

  /**
   * Get a distribution by ID
   * @param id Distribution ID
   * @returns Value distribution or null if not found
   */
  getDistribution(id: string): Promise<ValueDistribution | null>;

  /**
   * Calculate allocation for a distribution
   * @param distributionId Distribution ID
   * @returns Allocation per contributor
   */
  calculateAllocation(distributionId: string): Promise<DistributionAllocation[]>;
}

/**
 * Mock implementation of value distribution service (for MVP)
 */
export class MockValueDistributionService implements IValueDistributionService {
  private distributions: Map<string, ValueDistribution> = new Map();

  /**
   * Create a new value distribution
   * @param config Distribution configuration
   * @param contributions List of contributions
   * @param initiatorId ID of user initiating the distribution
   * @returns Created value distribution
   */
  async createDistribution(
    config: DistributionConfig,
    contributions: Contribution[],
    initiatorId: string
  ): Promise<ValueDistribution> {
    if (contributions.length === 0) {
      throw new Error('Cannot create distribution with no contributions');
    }

    const id = crypto.randomBytes(16).toString('hex');
    const now = Date.now();

    const distribution: ValueDistribution = {
      id,
      config,
      contributions,
      transactions: [],
      status: DistributionStatus.PENDING,
      initiatedBy: initiatorId,
      initiatedAt: now,
    };

    this.distributions.set(id, distribution);
    return distribution;
  }

  /**
   * Process a pending distribution
   * @param id Distribution ID
   * @returns Updated distribution
   */
  async processDistribution(id: string): Promise<ValueDistribution> {
    const distribution = this.distributions.get(id);

    if (!distribution) {
      throw new Error(`Distribution with ID ${id} not found`);
    }

    if (distribution.status !== DistributionStatus.PENDING) {
      throw new Error(`Distribution is already ${distribution.status}`);
    }

    // Update status to processing
    const processingDistribution: ValueDistribution = {
      ...distribution,
      status: DistributionStatus.PROCESSING,
    };
    this.distributions.set(id, processingDistribution);

    try {
      // Calculate allocation
      const allocations = await this.calculateAllocation(id);

      // Create transactions
      const transactions: DistributionTransaction[] = allocations.map(allocation => ({
        id: crypto.randomBytes(8).toString('hex'),
        recipientId: allocation.contributorId,
        amount: allocation.amount,
        tokenSymbol: distribution.config.tokenSymbol,
        txHash: `tx_${crypto.randomBytes(12).toString('hex')}`, // Mock transaction hash
        status: 'confirmed',
        timestamp: Date.now(),
      }));

      // Update with completed status and transactions
      const completedDistribution: ValueDistribution = {
        ...processingDistribution,
        status: DistributionStatus.COMPLETED,
        transactions,
        completedAt: Date.now(),
      };

      this.distributions.set(id, completedDistribution);
      return completedDistribution;
    } catch (error) {
      // Update with failed status
      const failedDistribution: ValueDistribution = {
        ...processingDistribution,
        status: DistributionStatus.FAILED,
        error: (error as Error).message,
        completedAt: Date.now(),
      };

      this.distributions.set(id, failedDistribution);
      return failedDistribution;
    }
  }

  /**
   * Get a distribution by ID
   * @param id Distribution ID
   * @returns Value distribution or null if not found
   */
  async getDistribution(id: string): Promise<ValueDistribution | null> {
    return this.distributions.get(id) || null;
  }

  /**
   * Calculate allocation for a distribution
   * @param distributionId Distribution ID
   * @returns Allocation per contributor
   */
  async calculateAllocation(distributionId: string): Promise<DistributionAllocation[]> {
    const distribution = this.distributions.get(distributionId);

    if (!distribution) {
      throw new Error(`Distribution with ID ${distributionId} not found`);
    }

    const { config, contributions } = distribution;
    const { totalAmount, modelType } = config;

    // Group contributions by contributor
    const contributorMap = new Map<string, {
      totalValue: number;
      count: number;
      contributions: Contribution[];
    }>();

    for (const contribution of contributions) {
      const { contributorId, value } = contribution;
      const current = contributorMap.get(contributorId) || {
        totalValue: 0,
        count: 0,
        contributions: [],
      };

      current.totalValue += value;
      current.count += 1;
      current.contributions.push(contribution);

      contributorMap.set(contributorId, current);
    }

    // Calculate allocations based on distribution model
    const allocations: DistributionAllocation[] = [];
    const contributors = Array.from(contributorMap.entries());

    switch (modelType) {
      case DistributionModelType.EQUAL: {
        // Equal distribution
        const amountPerContributor = totalAmount / contributors.length;
        for (const [contributorId, data] of contributors) {
          allocations.push({
            contributorId,
            amount: amountPerContributor,
            percentage: 1 / contributors.length,
            contributionCount: data.count,
            contributionValue: data.totalValue,
          });
        }
        break;
      }

      case DistributionModelType.PROPORTIONAL: {
        // Proportional to contribution value
        const totalContributionValue = contributors.reduce(
          (sum, [, data]) => sum + data.totalValue,
          0
        );

        for (const [contributorId, data] of contributors) {
          const percentage = data.totalValue / totalContributionValue;
          allocations.push({
            contributorId,
            amount: totalAmount * percentage,
            percentage,
            contributionCount: data.count,
            contributionValue: data.totalValue,
          });
        }
        break;
      }

      case DistributionModelType.WEIGHTEDRANK: {
        // Weighted rank distribution (higher ranks get more)
        const sortedContributors = contributors.sort(
          (a, b) => b[1].totalValue - a[1].totalValue
        );

        // Calculate rank weights (1/rank)
        let totalWeight = 0;
        const weights: number[] = [];

        for (let i = 0; i < sortedContributors.length; i++) {
          // Rank weight formula: 1 / (rank^0.8)
          // This makes higher ranks valuable but not overwhelmingly so
          const weight = 1 / Math.pow(i + 1, 0.8);
          weights.push(weight);
          totalWeight += weight;
        }

        // Distribute based on rank weights
        for (let i = 0; i < sortedContributors.length; i++) {
          const [contributorId, data] = sortedContributors[i];
          const percentage = weights[i] / totalWeight;
          allocations.push({
            contributorId,
            amount: totalAmount * percentage,
            percentage,
            contributionCount: data.count,
            contributionValue: data.totalValue,
          });
        }
        break;
      }

      case DistributionModelType.CUSTOM: {
        // Custom weights from configuration
        const { customWeights } = config;
        if (!customWeights) {
          throw new Error('Custom weights required for CUSTOM distribution model');
        }

        let totalWeight = 0;
        for (const [contributorId, ] of contributors) {
          const weight = customWeights[contributorId] || 0;
          totalWeight += weight;
        }

        for (const [contributorId, data] of contributors) {
          const weight = customWeights[contributorId] || 0;
          const percentage = weight / totalWeight;
          allocations.push({
            contributorId,
            amount: totalAmount * percentage,
            percentage,
            contributionCount: data.count,
            contributionValue: data.totalValue,
          });
        }
        break;
      }

      case DistributionModelType.MILESTONE: {
        // Each contribution represents a milestone with its own weight
        const totalContributionValue = contributions.reduce(
          (sum, contribution) => sum + contribution.value,
          0
        );

        // Group by contributor again based on milestone value
        const milestoneTotals = new Map<string, number>();
        for (const contribution of contributions) {
          const current = milestoneTotals.get(contribution.contributorId) || 0;
          milestoneTotals.set(
            contribution.contributorId,
            current + contribution.value
          );
        }

        for (const [contributorId, data] of contributors) {
          const milestoneValue = milestoneTotals.get(contributorId) || 0;
          const percentage = milestoneValue / totalContributionValue;
          allocations.push({
            contributorId,
            amount: totalAmount * percentage,
            percentage,
            contributionCount: data.count,
            contributionValue: data.totalValue,
          });
        }
        break;
      }

      default:
        throw new Error(`Unsupported distribution model: ${modelType}`);
    }

    return allocations;
  }
}

// Export a singleton instance
export const valueDistributionService = new MockValueDistributionService();
