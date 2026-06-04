import { Router } from "express";
import { db } from "@collateral-os/db";
import { alertsTable, activityTable } from "@collateral-os/db";
import { eq, and } from "drizzle-orm";
import {
  ListAlertsQueryParams,
  ResolveAlertParams,
} from "@collateral-os/api-zod";

const router = Router();

const fmt = (r: typeof alertsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  resolvedAt: r.resolvedAt?.toISOString() ?? null,
});

router.get("/", async (req, res) => {
  const query = ListAlertsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const conditions = [];
  if (query.data.severity) conditions.push(eq(alertsTable.severity, query.data.severity));
  if (query.data.resolved !== undefined) {
    conditions.push(eq(alertsTable.resolved, query.data.resolved === true || (query.data.resolved as unknown as string) === "true"));
  }

  const rows = await db
    .select()
    .from(alertsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alertsTable.createdAt);

  res.json(rows.map(fmt));
});

router.patch("/:id/resolve", async (req, res) => {
  const params = ResolveAlertParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .update(alertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(activityTable).values({
    type: "alert_resolved",
    description: `Alert resolved: ${row.message}`,
    entityId: row.id,
    entityType: "alert",
  });

  res.json(fmt(row));
});

export default router;
