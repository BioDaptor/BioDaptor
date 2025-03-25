/**
 * Access Control System for BioDaptor
 * Provides permission management and access control for resources
 */

import { UserRole } from '@shared/types';

/**
 * Permission levels for resources
 */
export enum PermissionLevel {
  NONE = 'none',         // No access
  READ = 'read',         // Read-only access
  CONTRIBUTE = 'contribute', // Can contribute/append but not modify
  WRITE = 'write',       // Full write access
  ADMIN = 'admin',       // Administrative access
  OWNER = 'owner',       // Owner access (cannot be revoked)
}

/**
 * Resource types that can be protected
 */
export enum ResourceType {
  DATASET = 'dataset',
  RESEARCH = 'research',
  COMPUTATION = 'computation',
  DISTRIBUTION = 'distribution',
  USER = 'user',
  SYSTEM = 'system',
}

/**
 * Access control policy for a resource
 */
export interface AccessPolicy {
  resourceId: string;
  resourceType: ResourceType;
  ownerId: string;
  publicAccess: PermissionLevel;
  userPermissions: Record<string, PermissionLevel>;
  rolePermissions: Partial<Record<UserRole, PermissionLevel>>;
  groupPermissions?: Record<string, PermissionLevel>;
  lastModified: number;
}

/**
 * Permission check result with details
 */
export interface PermissionCheckResult {
  granted: boolean;
  level: PermissionLevel;
  source: 'owner' | 'user' | 'role' | 'group' | 'public' | 'system';
}

/**
 * Access control service interface
 */
export interface IAccessControlService {
  /**
   * Create a new access policy for a resource
   * @param policy The access policy to create
   * @returns The created policy
   */
  createPolicy(policy: Omit<AccessPolicy, 'lastModified'>): Promise<AccessPolicy>;

  /**
   * Update an existing access policy
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param updates Policy updates
   * @returns Updated policy
   */
  updatePolicy(
    resourceId: string,
    resourceType: ResourceType,
    updates: Partial<Omit<AccessPolicy, 'resourceId' | 'resourceType' | 'lastModified'>>
  ): Promise<AccessPolicy>;

  /**
   * Get the access policy for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @returns Access policy or null if not found
   */
  getPolicy(resourceId: string, resourceType: ResourceType): Promise<AccessPolicy | null>;

  /**
   * Delete an access policy
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @returns Success status
   */
  deletePolicy(resourceId: string, resourceType: ResourceType): Promise<boolean>;

  /**
   * Check if a user has a specific permission on a resource
   * @param userId User ID
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param requiredLevel Required permission level
   * @returns Permission check result
   */
  checkPermission(
    userId: string,
    resourceId: string,
    resourceType: ResourceType,
    requiredLevel: PermissionLevel
  ): Promise<PermissionCheckResult>;

  /**
   * Grant permission to a user for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param userId User ID to grant permission to
   * @param level Permission level to grant
   * @returns Updated policy
   */
  grantUserPermission(
    resourceId: string,
    resourceType: ResourceType,
    userId: string,
    level: PermissionLevel
  ): Promise<AccessPolicy>;

  /**
   * Revoke permission from a user for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param userId User ID to revoke permission from
   * @returns Updated policy
   */
  revokeUserPermission(
    resourceId: string,
    resourceType: ResourceType,
    userId: string
  ): Promise<AccessPolicy>;
}

/**
 * In-memory implementation of access control service (for MVP)
 */
export class InMemoryAccessControlService implements IAccessControlService {
  private policies: Map<string, AccessPolicy> = new Map();

  /**
   * Create a new access policy for a resource
   * @param policy The access policy to create
   * @returns The created policy
   */
  async createPolicy(policy: Omit<AccessPolicy, 'lastModified'>): Promise<AccessPolicy> {
    const policyKey = this.getPolicyKey(policy.resourceId, policy.resourceType);
    const existingPolicy = this.policies.get(policyKey);

    if (existingPolicy) {
      throw new Error(`Policy for ${policy.resourceType}:${policy.resourceId} already exists`);
    }

    const newPolicy: AccessPolicy = {
      ...policy,
      lastModified: Date.now(),
    };

    this.policies.set(policyKey, newPolicy);
    return newPolicy;
  }

  /**
   * Update an existing access policy
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param updates Policy updates
   * @returns Updated policy
   */
  async updatePolicy(
    resourceId: string,
    resourceType: ResourceType,
    updates: Partial<Omit<AccessPolicy, 'resourceId' | 'resourceType' | 'lastModified'>>
  ): Promise<AccessPolicy> {
    const policyKey = this.getPolicyKey(resourceId, resourceType);
    const existingPolicy = this.policies.get(policyKey);

    if (!existingPolicy) {
      throw new Error(`Policy for ${resourceType}:${resourceId} not found`);
    }

    const updatedPolicy: AccessPolicy = {
      ...existingPolicy,
      ...updates,
      // Prevent overriding these fields
      resourceId,
      resourceType,
      lastModified: Date.now(),
    };

    this.policies.set(policyKey, updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Get the access policy for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @returns Access policy or null if not found
   */
  async getPolicy(resourceId: string, resourceType: ResourceType): Promise<AccessPolicy | null> {
    const policyKey = this.getPolicyKey(resourceId, resourceType);
    return this.policies.get(policyKey) || null;
  }

  /**
   * Delete an access policy
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @returns Success status
   */
  async deletePolicy(resourceId: string, resourceType: ResourceType): Promise<boolean> {
    const policyKey = this.getPolicyKey(resourceId, resourceType);
    return this.policies.delete(policyKey);
  }

  /**
   * Check if a user has a specific permission on a resource
   * @param userId User ID
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param requiredLevel Required permission level
   * @returns Permission check result with permission details
   */
  async checkPermission(
    userId: string,
    resourceId: string,
    resourceType: ResourceType,
    requiredLevel: PermissionLevel
  ): Promise<PermissionCheckResult> {
    const policy = await this.getPolicy(resourceId, resourceType);

    // No policy means no access
    if (!policy) {
      return { granted: false, level: PermissionLevel.NONE, source: 'system' };
    }

    // Check owner access (highest priority)
    if (policy.ownerId === userId) {
      return { granted: true, level: PermissionLevel.OWNER, source: 'owner' };
    }

    // Check user-specific permissions
    if (policy.userPermissions[userId]) {
      const level = policy.userPermissions[userId];
      const granted = this.isPermissionSufficient(level, requiredLevel);
      return { granted, level, source: 'user' };
    }

    // Check role-based permissions (would need user roles from somewhere)
    // In a real implementation, we would look up the user's roles
    const userRoles: UserRole[] = ['dataProvider']; // Mock for MVP
    for (const role of userRoles) {
      if (policy.rolePermissions[role]) {
        const level = policy.rolePermissions[role]!;
        const granted = this.isPermissionSufficient(level, requiredLevel);
        return { granted, level, source: 'role' };
      }
    }

    // Check group permissions
    // In a real implementation, we would check user group membership
    if (policy.groupPermissions) {
      // This is just a placeholder - actual implementation would check group membership
      const userGroups: string[] = []; // Mock for MVP
      for (const group of userGroups) {
        if (policy.groupPermissions[group]) {
          const level = policy.groupPermissions[group];
          const granted = this.isPermissionSufficient(level, requiredLevel);
          return { granted, level, source: 'group' };
        }
      }
    }

    // Default to public access
    const granted = this.isPermissionSufficient(policy.publicAccess, requiredLevel);
    return { granted, level: policy.publicAccess, source: 'public' };
  }

  /**
   * Grant permission to a user for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param userId User ID to grant permission to
   * @param level Permission level to grant
   * @returns Updated policy
   */
  async grantUserPermission(
    resourceId: string,
    resourceType: ResourceType,
    userId: string,
    level: PermissionLevel
  ): Promise<AccessPolicy> {
    const policy = await this.getPolicy(resourceId, resourceType);

    if (!policy) {
      throw new Error(`Policy for ${resourceType}:${resourceId} not found`);
    }

    const updatedPermissions = {
      ...policy.userPermissions,
      [userId]: level,
    };

    return this.updatePolicy(resourceId, resourceType, {
      userPermissions: updatedPermissions,
    });
  }

  /**
   * Revoke permission from a user for a resource
   * @param resourceId Resource ID
   * @param resourceType Resource type
   * @param userId User ID to revoke permission from
   * @returns Updated policy
   */
  async revokeUserPermission(
    resourceId: string,
    resourceType: ResourceType,
    userId: string
  ): Promise<AccessPolicy> {
    const policy = await this.getPolicy(resourceId, resourceType);

    if (!policy) {
      throw new Error(`Policy for ${resourceType}:${resourceId} not found`);
    }

    // Prevent revoking from the owner
    if (policy.ownerId === userId) {
      throw new Error('Cannot revoke permission from the resource owner');
    }

    const updatedPermissions = { ...policy.userPermissions };
    delete updatedPermissions[userId];

    return this.updatePolicy(resourceId, resourceType, {
      userPermissions: updatedPermissions,
    });
  }

  /**
   * Create a unique key for storing policies
   */
  private getPolicyKey(resourceId: string, resourceType: ResourceType): string {
    return `${resourceType}:${resourceId}`;
  }

  /**
   * Check if a permission level is sufficient for the required level
   */
  private isPermissionSufficient(provided: PermissionLevel, required: PermissionLevel): boolean {
    const permissionRank = {
      [PermissionLevel.NONE]: 0,
      [PermissionLevel.READ]: 1,
      [PermissionLevel.CONTRIBUTE]: 2,
      [PermissionLevel.WRITE]: 3,
      [PermissionLevel.ADMIN]: 4,
      [PermissionLevel.OWNER]: 5,
    };

    return permissionRank[provided] >= permissionRank[required];
  }
}

// Export a singleton instance
export const accessControlService = new InMemoryAccessControlService();
