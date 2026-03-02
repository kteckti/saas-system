/**
 * Dashboard Widgets Router
 * Implements configurable widgets system (todo.md Phase 4)
 * - Add configurable widgets system
 * - Implement quick actions panel
 * - Create dashboard customization UI
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { dashboardWidgets } from "../../drizzle/schema";

const widgetConfigSchema = z.object({
  title: z.string().optional(),
  color: z.string().optional(),
  showLegend: z.boolean().optional(),
  chartType: z.enum(["bar", "line", "pie", "area"]).optional(),
  dateRange: z.enum(["7d", "30d", "90d", "1y"]).optional(),
  limit: z.number().optional(),
  currency: z.string().optional(),
});

export const dashboardWidgetsRouter = router({
  /**
   * Get all widgets for the current user
   */
  getWidgets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      return await db
        .select()
        .from(dashboardWidgets)
        .where(
          and(
            eq(dashboardWidgets.tenantId, ctx.user.tenantId),
            eq(dashboardWidgets.userId, ctx.user.id),
            eq(dashboardWidgets.isActive, true)
          )
        )
        .orderBy(dashboardWidgets.position);
    } catch (error) {
      console.error("[Dashboard Widgets] Error getting widgets:", error);
      return [];
    }
  }),

  /**
   * Create a new widget
   */
  createWidget: protectedProcedure
    .input(
      z.object({
        widgetType: z.enum([
          "revenue_chart",
          "expense_chart",
          "cash_flow",
          "leads_funnel",
          "recent_transactions",
          "inventory_alerts",
          "kpi_revenue",
          "kpi_leads",
          "kpi_inventory",
          "kpi_expenses",
          "quick_actions",
          "recent_leads",
          "top_products",
          "payables_summary",
          "receivables_summary",
        ]),
        title: z.string(),
        size: z.enum(["small", "medium", "large"]).default("medium"),
        position: z.number().default(0),
        config: widgetConfigSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const result = await db
          .insert(dashboardWidgets)
          .values({
            tenantId: ctx.user.tenantId,
            userId: ctx.user.id,
            widgetType: input.widgetType,
            title: input.title,
            size: input.size,
            position: input.position,
            config: input.config ?? null,
            isActive: true,
          })
          .returning();

        return result[0];
      } catch (error) {
        console.error("[Dashboard Widgets] Error creating widget:", error);
        throw error;
      }
    }),

  /**
   * Update widget configuration
   */
  updateWidget: protectedProcedure
    .input(
      z.object({
        widgetId: z.number(),
        title: z.string().optional(),
        size: z.enum(["small", "medium", "large"]).optional(),
        position: z.number().optional(),
        config: widgetConfigSchema.optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.size !== undefined) updateData.size = input.size;
        if (input.position !== undefined) updateData.position = input.position;
        if (input.config !== undefined) updateData.config = input.config;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        await db
          .update(dashboardWidgets)
          .set(updateData)
          .where(
            and(
              eq(dashboardWidgets.id, input.widgetId),
              eq(dashboardWidgets.tenantId, ctx.user.tenantId),
              eq(dashboardWidgets.userId, ctx.user.id)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Dashboard Widgets] Error updating widget:", error);
        throw error;
      }
    }),

  /**
   * Delete a widget
   */
  deleteWidget: protectedProcedure
    .input(z.object({ widgetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db
          .delete(dashboardWidgets)
          .where(
            and(
              eq(dashboardWidgets.id, input.widgetId),
              eq(dashboardWidgets.tenantId, ctx.user.tenantId),
              eq(dashboardWidgets.userId, ctx.user.id)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("[Dashboard Widgets] Error deleting widget:", error);
        throw error;
      }
    }),

  /**
   * Reorder widgets (update positions)
   */
  reorderWidgets: protectedProcedure
    .input(
      z.object({
        widgetPositions: z.array(
          z.object({
            widgetId: z.number(),
            position: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        for (const { widgetId, position } of input.widgetPositions) {
          await db
            .update(dashboardWidgets)
            .set({ position, updatedAt: new Date() })
            .where(
              and(
                eq(dashboardWidgets.id, widgetId),
                eq(dashboardWidgets.tenantId, ctx.user.tenantId),
                eq(dashboardWidgets.userId, ctx.user.id)
              )
            );
        }

        return { success: true };
      } catch (error) {
        console.error("[Dashboard Widgets] Error reordering widgets:", error);
        throw error;
      }
    }),

  /**
   * Reset dashboard to default layout
   */
  resetToDefault: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Remove all existing widgets for this user
      await db
        .delete(dashboardWidgets)
        .where(
          and(
            eq(dashboardWidgets.tenantId, ctx.user.tenantId),
            eq(dashboardWidgets.userId, ctx.user.id)
          )
        );

      // Create default widgets
      const defaultWidgets = [
        { widgetType: "kpi_revenue", title: "Receita Total", size: "small" as const, position: 0 },
        { widgetType: "kpi_expenses", title: "Despesas Totais", size: "small" as const, position: 1 },
        { widgetType: "kpi_leads", title: "Leads Ativos", size: "small" as const, position: 2 },
        { widgetType: "kpi_inventory", title: "Valor do Estoque", size: "small" as const, position: 3 },
        { widgetType: "cash_flow", title: "Fluxo de Caixa", size: "large" as const, position: 4 },
        { widgetType: "recent_transactions", title: "Transações Recentes", size: "medium" as const, position: 5 },
        { widgetType: "leads_funnel", title: "Pipeline de Vendas", size: "medium" as const, position: 6 },
        { widgetType: "inventory_alerts", title: "Alertas de Estoque", size: "medium" as const, position: 7 },
      ];

      for (const widget of defaultWidgets) {
        await db.insert(dashboardWidgets).values({
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          widgetType: widget.widgetType,
          title: widget.title,
          size: widget.size,
          position: widget.position,
          isActive: true,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("[Dashboard Widgets] Error resetting to default:", error);
      throw error;
    }
  }),

  /**
   * Get available widget types
   */
  getAvailableWidgets: protectedProcedure.query(async () => {
    return [
      {
        type: "kpi_revenue",
        name: "KPI - Receita",
        description: "Receita total do período",
        category: "financial",
        sizes: ["small", "medium"],
      },
      {
        type: "kpi_expenses",
        name: "KPI - Despesas",
        description: "Despesas totais do período",
        category: "financial",
        sizes: ["small", "medium"],
      },
      {
        type: "kpi_leads",
        name: "KPI - Leads",
        description: "Número de leads ativos",
        category: "crm",
        sizes: ["small", "medium"],
      },
      {
        type: "kpi_inventory",
        name: "KPI - Estoque",
        description: "Valor total do estoque",
        category: "inventory",
        sizes: ["small", "medium"],
      },
      {
        type: "cash_flow",
        name: "Fluxo de Caixa",
        description: "Gráfico de fluxo de caixa",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "revenue_chart",
        name: "Gráfico de Receita",
        description: "Receita por período",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "expense_chart",
        name: "Gráfico de Despesas",
        description: "Despesas por categoria",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "recent_transactions",
        name: "Transações Recentes",
        description: "Últimas transações financeiras",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "leads_funnel",
        name: "Funil de Vendas",
        description: "Pipeline de leads por estágio",
        category: "crm",
        sizes: ["medium", "large"],
      },
      {
        type: "recent_leads",
        name: "Leads Recentes",
        description: "Últimos leads adicionados",
        category: "crm",
        sizes: ["medium", "large"],
      },
      {
        type: "inventory_alerts",
        name: "Alertas de Estoque",
        description: "Produtos com estoque baixo",
        category: "inventory",
        sizes: ["medium", "large"],
      },
      {
        type: "top_products",
        name: "Top Produtos",
        description: "Produtos mais movimentados",
        category: "inventory",
        sizes: ["medium", "large"],
      },
      {
        type: "payables_summary",
        name: "Contas a Pagar",
        description: "Resumo de contas a pagar",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "receivables_summary",
        name: "Contas a Receber",
        description: "Resumo de contas a receber",
        category: "financial",
        sizes: ["medium", "large"],
      },
      {
        type: "quick_actions",
        name: "Ações Rápidas",
        description: "Atalhos para ações frequentes",
        category: "general",
        sizes: ["small", "medium"],
      },
    ];
  }),
});
