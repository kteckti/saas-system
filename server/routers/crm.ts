import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  leads,
  opportunities,
  interactions,
  pipelineStages,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const crmRouter = router({
  /**
   * Get all leads for the tenant
   */
  getLeads: protectedProcedure
    .input(
      z.object({
        status: z.enum(["new", "contacted", "qualified", "lost", "converted"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const whereConditions = input.status
          ? and(eq(leads.tenantId, ctx.user.tenantId), eq(leads.status, input.status))
          : eq(leads.tenantId, ctx.user.tenantId);

        return await db
          .select()
          .from(leads)
          .where(whereConditions)
          .orderBy(desc(leads.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[CRM] Error getting leads:", error);
        return [];
      }
    }),

  /**
   * Create a new lead
   */
  createLead: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(leads).values({
          tenantId: ctx.user.tenantId,
          ...input,
          status: "new",
          score: 0,
        });

        return { success: true };
      } catch (error) {
        console.error("[CRM] Error creating lead:", error);
        throw error;
      }
    }),

  /**
   * Get opportunities
   */
  getOpportunities: protectedProcedure
    .input(
      z.object({
        stage: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const whereConditions = input.stage
          ? and(eq(opportunities.tenantId, ctx.user.tenantId), eq(opportunities.stage, input.stage))
          : eq(opportunities.tenantId, ctx.user.tenantId);

        return await db
          .select()
          .from(opportunities)
          .where(whereConditions)
          .orderBy(desc(opportunities.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      } catch (error) {
        console.error("[CRM] Error getting opportunities:", error);
        return [];
      }
    }),

  /**
   * Create a new opportunity
   */
  createOpportunity: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        value: z.string(),
        stage: z.string(),
        expectedCloseDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(opportunities).values({
          tenantId: ctx.user.tenantId,
          ...input,
          currency: "USD",
          probability: 0,
          status: "open",
        });

        return { success: true };
      } catch (error) {
        console.error("[CRM] Error creating opportunity:", error);
        throw error;
      }
    }),

  /**
   * Get interactions for a lead
   */
  getInteractions: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        return await db
          .select()
          .from(interactions)
          .where(
            and(
              eq(interactions.tenantId, ctx.user.tenantId),
              eq(interactions.leadId, input.leadId)
            )
          )
          .orderBy(desc(interactions.createdAt))
          .limit(input.limit);
      } catch (error) {
        console.error("[CRM] Error getting interactions:", error);
        return [];
      }
    }),

  /**
   * Create a new interaction
   */
  createInteraction: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        type: z.enum(["call", "email", "meeting", "note", "task"]),
        subject: z.string(),
        description: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        await db.insert(interactions).values({
          tenantId: ctx.user.tenantId,
          ...input,
          createdBy: ctx.user.id,
        });

        return { success: true };
      } catch (error) {
        console.error("[CRM] Error creating interaction:", error);
        throw error;
      }
    }),

  /**
   * Get pipeline stages
   */
  getPipelineStages: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
      if (!hasAccess) throw new Error("Module not accessible");

      return await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.tenantId, ctx.user.tenantId))
        .orderBy(pipelineStages.order);
    } catch (error) {
      console.error("[CRM] Error getting pipeline stages:", error);
      return [];
    }
  }),

  /**
   * Get CRM summary/dashboard data
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
      if (!hasAccess) throw new Error("Module not accessible");

      // Get lead counts by status
      const allLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, ctx.user.tenantId));

      const newLeads = allLeads.filter((l) => l.status === "new").length;
      const qualifiedLeads = allLeads.filter((l) => l.status === "qualified").length;
      const convertedLeads = allLeads.filter((l) => l.status === "converted").length;

      // Get open opportunities
      const openOpportunities = await db
        .select()
        .from(opportunities)
        .where(
          and(
            eq(opportunities.tenantId, ctx.user.tenantId),
            eq(opportunities.status, "open")
          )
        );

      return {
        totalLeads: allLeads.length,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        openOpportunities: openOpportunities.length,
      };
    } catch (error) {
      console.error("[CRM] Error getting summary:", error);
      return null;
    }
  }),
});
