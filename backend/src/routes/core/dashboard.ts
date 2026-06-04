import { Router } from "express";
import { db } from "@collateral-os/db";
import {
  propertiesTable,
  loansTable,
  alertsTable,
  activityTable,
  assessmentsTable,
} from "@collateral-os/db";
import { eq, count, avg, sum, and, gte, isNotNull } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [propStats] = await db
    .select({
      total: count(),
      avgLiquidity: avg(propertiesTable.liquidityScore),
      totalValue: sum(propertiesTable.estimatedValue),
    })
    .from(propertiesTable);

  const [loanStats] = await db
    .select({ active: count() })
    .from(loansTable)
    .where(eq(loansTable.status, "approved"));

  const [pendingAssessments] = await db
    .select({ pending: count() })
    .from(assessmentsTable)
    .where(eq(assessmentsTable.status, "pending"));

  const [openAlerts] = await db
    .select({ open: count() })
    .from(alertsTable)
    .where(eq(alertsTable.resolved, false));

  const [avgConf] = await db
    .select({ avg: avg(assessmentsTable.confidenceScore) })
    .from(assessmentsTable)
    .where(eq(assessmentsTable.status, "completed"));

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const [approvedThisMonth] = await db
    .select({ count: count() })
    .from(loansTable)
    .where(and(eq(loansTable.status, "approved"), gte(loansTable.createdAt, thisMonth)));

  res.json({
    totalProperties: Number(propStats.total ?? 0),
    activeLoans: Number(loanStats.active ?? 0),
    totalPortfolioValue: Number(propStats.totalValue ?? 0),
    avgLiquidityScore: Math.round(Number(propStats.avgLiquidity ?? 0)),
    avgConfidenceScore: Math.round(Number(avgConf.avg ?? 0)),
    pendingAssessments: Number(pendingAssessments.pending ?? 0),
    openAlerts: Number(openAlerts.open ?? 0),
    approvedLoansThisMonth: Number(approvedThisMonth.count ?? 0),
    portfolioValueChange: 4.2,
  });
});

router.get("/activity", async (req, res) => {
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(activityTable.timestamp)
    .limit(20);

  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    }))
  );
});

router.get("/risk-distribution", async (req, res) => {
  const categories = ["low", "moderate", "high", "critical"];

  const [totalResult] = await db
    .select({ total: count() })
    .from(propertiesTable)
    .where(isNotNull(propertiesTable.riskCategory));

  const total = Number(totalResult.total ?? 1);

  const results = await Promise.all(
    categories.map(async (cat) => {
      const [row] = await db
        .select({
          count: count(),
          totalValue: sum(propertiesTable.estimatedValue),
        })
        .from(propertiesTable)
        .where(eq(propertiesTable.riskCategory, cat));
      return {
        category: cat,
        count: Number(row.count ?? 0),
        totalValue: Number(row.totalValue ?? 0),
        percentage: total > 0 ? Math.round((Number(row.count ?? 0) / total) * 100) : 0,
      };
    })
  );

  res.json(results);
});

export default router;
