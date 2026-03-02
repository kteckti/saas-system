import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  leads,
  opportunities,
  interactions,
  pipelineStages,
} from "../../drizzle/schema";
import { canAccessModule } from "../rbac";

export const crmAnalyticsRouter = router({
  /**
   * Get sales pipeline visualization
   */
  getSalesPipeline: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    try {
      const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
      if (!hasAccess) throw new Error("Module not accessible");

      // Get pipeline stages
      const stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.tenantId, ctx.user.tenantId))
        .orderBy(pipelineStages.order);

      // Get opportunities grouped by stage
      const allOpportunities = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.tenantId, ctx.user.tenantId));

      const pipelineData = stages.map((stage) => {
        const stageOpportunities = allOpportunities.filter((opp) => opp.stage === stage.name);
        const totalValue = stageOpportunities.reduce(
          (sum, opp) => sum + parseFloat(opp.value as any),
          0
        );
        const avgProbability =
          stageOpportunities.length > 0
            ? stageOpportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) /
              stageOpportunities.length
            : 0;

        return {
          stage: stage.name,
          stageId: stage.id,
          color: stage.color,
          count: stageOpportunities.length,
          totalValue,
          avgProbability: Math.round(avgProbability),
          opportunities: stageOpportunities,
        };
      });

      const totalPipelineValue = pipelineData.reduce((sum, stage) => sum + stage.totalValue, 0);

      return {
        stages: pipelineData,
        totalValue: totalPipelineValue,
        totalOpportunities: allOpportunities.length,
      };
    } catch (error) {
      console.error("[CRM Analytics] Error getting sales pipeline:", error);
      return null;
    }
  }),

  /**
   * Calculate lead score based on interactions and status
   */
  calculateLeadScore: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return 0;

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        const lead = await db
          .select()
          .from(leads)
          .where(
            and(eq(leads.id, input.leadId), eq(leads.tenantId, ctx.user.tenantId))
          )
          .limit(1);

        if (!lead.length) throw new Error("Lead not found");

        // Get interactions for this lead
        const leadInteractions = await db
          .select()
          .from(interactions)
          .where(
            and(
              eq(interactions.leadId, input.leadId),
              eq(interactions.tenantId, ctx.user.tenantId)
            )
          );

        // Calculate score
        let score = 0;

        // Base score by status
        const statusScores: Record<string, number> = {
          new: 10,
          contacted: 25,
          qualified: 50,
          lost: 0,
          converted: 100,
        };
        score += statusScores[lead[0].status] || 0;

        // Bonus for interactions
        score += Math.min(leadInteractions.length * 5, 30);

        // Bonus for company and position info
        if (lead[0].company) score += 10;
        if (lead[0].position) score += 10;

        // Bonus for recent interactions (within last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentInteractions = leadInteractions.filter(
          (i) => i.createdAt > sevenDaysAgo
        ).length;
        score += Math.min(recentInteractions * 10, 20);

        // Cap at 100
        score = Math.min(score, 100);

        return score;
      } catch (error) {
        console.error("[CRM Analytics] Error calculating lead score:", error);
        return 0;
      }
    }),

  /**
   * Get CRM analytics report
   */
  getCRMReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
        if (!hasAccess) throw new Error("Module not accessible");

        // Get all leads
        const allLeads = await db
          .select()
          .from(leads)
          .where(eq(leads.tenantId, ctx.user.tenantId));

        // Get all opportunities
        const allOpportunities = await db
          .select()
          .from(opportunities)
          .where(eq(opportunities.tenantId, ctx.user.tenantId));

        // Get all interactions
        const allInteractions = await db
          .select()
          .from(interactions)
          .where(eq(interactions.tenantId, ctx.user.tenantId));

        // Calculate metrics
        const leadsByStatus = {
          new: allLeads.filter((l) => l.status === "new").length,
          contacted: allLeads.filter((l) => l.status === "contacted").length,
          qualified: allLeads.filter((l) => l.status === "qualified").length,
          lost: allLeads.filter((l) => l.status === "lost").length,
          converted: allLeads.filter((l) => l.status === "converted").length,
        };

        const opportunitiesByStatus = {
          open: allOpportunities.filter((o) => o.status === "open").length,
          won: allOpportunities.filter((o) => o.status === "won").length,
          lost: allOpportunities.filter((o) => o.status === "lost").length,
          suspended: allOpportunities.filter((o) => o.status === "suspended").length,
        };

        const totalOpportunityValue = allOpportunities.reduce(
          (sum, opp) => sum + parseFloat(opp.value as any),
          0
        );

        const wonOpportunityValue = allOpportunities
          .filter((o) => o.status === "won")
          .reduce((sum, opp) => sum + parseFloat(opp.value as any), 0);

        const conversionRate =
          allLeads.length > 0
            ? ((leadsByStatus.converted / allLeads.length) * 100).toFixed(2)
            : "0";

        const winRate =
          allOpportunities.length > 0
            ? ((opportunitiesByStatus.won / allOpportunities.length) * 100).toFixed(2)
            : "0";

        const avgInteractionsPerLead =
          allLeads.length > 0 ? (allInteractions.length / allLeads.length).toFixed(2) : "0";

        return {
          leads: {
            total: allLeads.length,
            byStatus: leadsByStatus,
            conversionRate: parseFloat(conversionRate),
          },
          opportunities: {
            total: allOpportunities.length,
            byStatus: opportunitiesByStatus,
            totalValue: totalOpportunityValue,
            wonValue: wonOpportunityValue,
            winRate: parseFloat(winRate),
          },
          interactions: {
            total: allInteractions.length,
            avgPerLead: parseFloat(avgInteractionsPerLead),
          },
        };
      } catch (error) {
        console.error("[CRM Analytics] Error getting CRM report:", error);
        return null;
      }
    }),

  /**
   * Get lead scoring insights
   */
  getLeadScoringInsights: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const hasAccess = await canAccessModule(ctx.user.id, ctx.user.tenantId, "crm");
      if (!hasAccess) throw new Error("Module not accessible");

      const allLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, ctx.user.tenantId))
        .orderBy(desc(leads.score));

      // Calculate scores for all leads
      const leadsWithScores = await Promise.all(
        allLeads.map(async (lead) => {
          const interactions = await db
            .select()
            .from(interactions)
            .where(
              and(
                eq(interactions.leadId, lead.id),
                eq(interactions.tenantId, ctx.user.tenantId)
              )
            );

          let score = 0;
          const statusScores: Record<string, number> = {
            new: 10,
            contacted: 25,
            qualified: 50,
            lost: 0,
            converted: 100,
          };
          score += statusScores[lead.status] || 0;
          score += Math.min(interactions.length * 5, 30);
          if (lead.company) score += 10;
          if (lead.position) score += 10;

          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentInteractions = interactions.filter(
            (i) => i.createdAt > sevenDaysAgo
          ).length;
          score += Math.min(recentInteractions * 10, 20);
          score = Math.min(score, 100);

          return {
            ...lead,
            calculatedScore: score,
            interactionCount: interactions.length,
          };
        })
      );

      return leadsWithScores.sort((a, b) => b.calculatedScore - a.calculatedScore);
    } catch (error) {
      console.error("[CRM Analytics] Error getting lead scoring insights:", error);
      return [];
    }
  }),
});
