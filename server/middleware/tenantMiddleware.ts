import { Request, Response, NextFunction } from "express";
import { verifyTenantAccess } from "../rbac";

/**
 * Middleware to verify tenant access
 * Ensures users can only access data from their assigned tenant
 */
export async function tenantMiddleware(
  req: Request & { userId?: number; tenantId?: string },
  res: Response,
  next: NextFunction
) {
  try {
    // Get userId and tenantId from session/JWT
    const userId = (req as any).userId;
    const targetTenantId = req.params.tenantId || (req as any).tenantId;

    if (!userId || !targetTenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify tenant access
    const hasAccess = await verifyTenantAccess(userId, targetTenantId);

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this tenant" });
    }

    // Store tenantId in request for downstream handlers
    (req as any).tenantId = targetTenantId;
    next();
  } catch (error) {
    console.error("[Tenant Middleware] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to verify module access
 * Ensures users can only access modules that are active for their tenant
 */
export async function moduleAccessMiddleware(
  req: Request & { userId?: number; tenantId?: string },
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).userId;
    const tenantId = (req as any).tenantId;
    const moduleSlug = req.params.module as
      | "dashboard"
      | "financial"
      | "crm"
      | "inventory"
      | undefined;

    if (!userId || !tenantId || !moduleSlug) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Import here to avoid circular dependency
    const { canAccessModule } = await import("../rbac");
    const hasAccess = await canAccessModule(userId, tenantId, moduleSlug);

    if (!hasAccess) {
      return res.status(403).json({ error: "Module not accessible" });
    }

    next();
  } catch (error) {
    console.error("[Module Access Middleware] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware to verify owner/admin access
 * Ensures only organization owners or admins can perform certain actions
 */
export async function adminMiddleware(
  req: Request & { userId?: number; tenantId?: string; userRole?: string },
  res: Response,
  next: NextFunction
) {
  try {
    const userRole = (req as any).userRole;

    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("[Admin Middleware] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
