/**
 * Database Seed Script
 * Creates the initial admin user and organization for SmartOps
 *
 * Admin credentials:
 *   Email: kteckti@gmail.com
 *   Password: SmartOps@2026!
 *   Role: owner (acesso total)
 *
 * Run: pnpm run db:seed
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  users,
  organizations,
  modules,
  tenantModules,
  subscriptions,
} from "../drizzle/schema";

const ADMIN_EMAIL = "kteckti@gmail.com";
const ADMIN_PASSWORD = "SmartOps@2026!";
const ADMIN_OPEN_ID = "local_admin_kteckti";
const TENANT_ID = "tenant_smartops_default";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" && !databaseUrl.includes("localhost")
      ? { rejectUnauthorized: false }
      : false,
  });

  const db = drizzle(pool);

  console.log("🌱 Starting database seed...");

  try {
    // 1. Create default organization
    console.log("📦 Creating default organization...");
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.tenantId, TENANT_ID))
      .limit(1);

    if (!existingOrg.length) {
      await db.insert(organizations).values({
        tenantId: TENANT_ID,
        name: "SmartOps Admin",
        slug: "smartops-admin",
        description: "Organização principal do sistema SmartOps",
        timezone: "America/Sao_Paulo",
        theme: "light",
      });
      console.log("✅ Organization created");
    } else {
      console.log("ℹ️  Organization already exists, skipping...");
    }

    // 2. Create admin user
    console.log("👤 Creating admin user...");
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    if (!existingUser.length) {
      await db.insert(users).values({
        tenantId: TENANT_ID,
        openId: ADMIN_OPEN_ID,
        email: ADMIN_EMAIL,
        name: "Administrador SmartOps",
        passwordHash,
        role: "owner",
        status: "active",
        theme: "light",
        lastSignedIn: new Date(),
      });
      console.log("✅ Admin user created");
    } else {
      // Update password hash if user exists
      await db
        .update(users)
        .set({
          passwordHash,
          role: "owner",
          status: "active",
          tenantId: TENANT_ID,
          openId: ADMIN_OPEN_ID,
          updatedAt: new Date(),
        })
        .where(eq(users.email, ADMIN_EMAIL));
      console.log("✅ Admin user updated");
    }

    // 3. Create modules
    console.log("🔧 Creating modules...");
    const modulesList = [
      {
        name: "Dashboard",
        slug: "dashboard",
        description: "Visão geral do negócio com KPIs e widgets",
        icon: "BarChart3",
        monthlyPrice: "0.00",
      },
      {
        name: "Financeiro",
        slug: "financial",
        description: "Gestão financeira completa: contas, transações, relatórios",
        icon: "DollarSign",
        monthlyPrice: "99.00",
      },
      {
        name: "CRM",
        slug: "crm",
        description: "Gestão de leads, pipeline de vendas e interações",
        icon: "Users",
        monthlyPrice: "149.00",
      },
      {
        name: "Estoque",
        slug: "inventory",
        description: "Controle de produtos, fornecedores e movimentações",
        icon: "Package",
        monthlyPrice: "129.00",
      },
    ];

    for (const mod of modulesList) {
      const existing = await db
        .select()
        .from(modules)
        .where(eq(modules.slug, mod.slug))
        .limit(1);

      if (!existing.length) {
        await db.insert(modules).values({ ...mod, isActive: true });
        console.log(`  ✅ Module "${mod.name}" created`);
      } else {
        console.log(`  ℹ️  Module "${mod.name}" already exists`);
      }
    }

    // 4. Activate all modules for admin tenant
    console.log("🔓 Activating all modules for admin tenant...");
    const allModules = await db.select().from(modules);

    for (const mod of allModules) {
      const existing = await db
        .select()
        .from(tenantModules)
        .where(eq(tenantModules.tenantId, TENANT_ID))
        .limit(1);

      if (!existing.length) {
        await db.insert(tenantModules).values({
          tenantId: TENANT_ID,
          moduleId: mod.id,
          isActive: true,
          activatedAt: new Date(),
        });
        console.log(`  ✅ Module "${mod.name}" activated for admin tenant`);
      }
    }

    // 5. Create subscription for admin tenant
    console.log("💳 Creating subscription for admin tenant...");
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, TENANT_ID))
      .limit(1);

    if (!existingSubscription.length) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 days trial

      await db.insert(subscriptions).values({
        tenantId: TENANT_ID,
        status: "active",
        monthlyAmount: "0.00",
        trialEndsAt: trialEnd,
      });
      console.log("✅ Subscription created (active)");
    } else {
      console.log("ℹ️  Subscription already exists");
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Admin credentials:");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: owner (acesso total)`);
    console.log(`   TenantId: ${TENANT_ID}`);
    console.log("\n🔐 Use these credentials to login at /login");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
