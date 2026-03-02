import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { users, tenantModules, modules } from "../drizzle/schema";

/**
 * RBAC System for SmartOps
 * Manages role-based access control and module permissions
 */

export type Role = "owner" | "admin" | "user";
export type ModuleSlug = "dashboard" | "financial" | "crm" | "inventory";

/**
 * Role permissions matrix
 * Defines what actions each role can perform
 */
export const rolePermissions: Record<Role, string[]> = {
  owner: [
    "manage_organization",
    "manage_users",
    "manage_modules",
    "manage_billing",
    "view_analytics",
    "manage_settings",
    "access_all_modules",
    "access_assigned_modules",
  ],
  admin: [
    "manage_users",
    "manage_settings",
    "view_analytics",
    "access_all_modules",
    "access_assigned_modules",
  ],
  user: [
    "view_analytics",
    "access_assigned_modules",
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: Role, permission: string): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

/**
 * Verify permission hierarchy is correct
 */
export function verifyPermissionHierarchy(): boolean {
  const userPerms = new Set(rolePermissions.user);
  const adminPerms = new Set(rolePermissions.admin);
  const ownerPerms = new Set(rolePermissions.owner);

  // Admin should have all user permissions
  const userPermsArray = Array.from(userPerms);
  for (let i = 0; i < userPermsArray.length; i++) {
    const perm = userPermsArray[i];
    if (!adminPerms.has(perm)) {
      console.warn(`[RBAC] Admin missing user permission: ${perm}`);
      return false;
    }
  }

  // Owner should have all admin permissions
  const adminPermsArray = Array.from(adminPerms);
  for (let i = 0; i < adminPermsArray.length; i++) {
    const perm = adminPermsArray[i];
    if (!ownerPerms.has(perm)) {
      console.warn(`[RBAC] Owner missing admin permission: ${perm}`);
      return false;
    }
  }

  return true;
}

/**
 * Check if a user can access a specific module
 */
export async function canAccessModule(
  userId: number,
  tenantId: string,
  moduleSlug: ModuleSlug
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get user
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user.length) return false;

    const userRole = user[0]?.role;

    // Owner and admin have access to all modules
    if (userRole === "owner" || userRole === "admin") {
      return true;
    }

    // Check if module is active for tenant
    const module = await db
      .select()
      .from(modules)
      .where(eq(modules.slug, moduleSlug))
      .limit(1);

    if (!module.length) return false;

    const tenantModule = await db
      .select()
      .from(tenantModules)
      .where(
        and(
          eq(tenantModules.tenantId, tenantId),
          eq(tenantModules.moduleId, module[0]!.id),
          eq(tenantModules.isActive, true)
        )
      )
      .limit(1);

    return tenantModule.length > 0;
  } catch (error) {
    console.error("[RBAC] Error checking module access:", error);
    return false;
  }
}

/**
 * Get all active modules for a tenant
 */
export async function getTenantModules(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: modules.id,
        name: modules.name,
        slug: modules.slug,
        description: modules.description,
        icon: modules.icon,
        monthlyPrice: modules.monthlyPrice,
      })
      .from(tenantModules)
      .innerJoin(modules, eq(tenantModules.moduleId, modules.id))
      .where(
        and(
          eq(tenantModules.tenantId, tenantId),
          eq(tenantModules.isActive, true)
        )
      );

    return result;
  } catch (error) {
    console.error("[RBAC] Error getting tenant modules:", error);
    return [];
  }
}

/**
 * Check if a user can perform an action on a resource
 */
export async function canPerformAction(
  userId: number,
  tenantId: string,
  action: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!user.length) return false;

    const userRole = user[0]?.role;
    return hasPermission(userRole, action);
  } catch (error) {
    console.error("[RBAC] Error checking action permission:", error);
    return false;
  }
}

/**
 * Verify multi-tenant isolation
 * Ensures user can only access data from their tenant
 */
export async function verifyTenantAccess(
  userId: number,
  targetTenantId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) return false;

    return user[0]?.tenantId === targetTenantId;
  } catch (error) {
    console.error("[RBAC] Error verifying tenant access:", error);
    return false;
  }
}

/**
 * Get user's role in a tenant
 */
export async function getUserRole(
  userId: number,
  tenantId: string
): Promise<Role | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    return user.length > 0 ? user[0]?.role || null : null;
  } catch (error) {
    console.error("[RBAC] Error getting user role:", error);
    return null;
  }
}

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(
  userId: number,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return role === "owner";
}

/**
 * Check if user is admin or owner
 */
export async function isAdminOrOwner(
  userId: number,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return role === "admin" || role === "owner";
}
