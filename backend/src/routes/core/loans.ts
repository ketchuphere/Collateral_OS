import { Router } from "express";
import { db } from "@collateral-os/db";
import { loansTable, activityTable } from "@collateral-os/db";
import { eq, and } from "drizzle-orm";
import {
  ListLoansQueryParams,
  CreateLoanBody,
  UpdateLoanBody,
  GetLoanParams,
  UpdateLoanParams,
} from "@collateral-os/api-zod";

const router = Router();

const fmt = (r: typeof loansTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
});

router.get("/", async (req, res) => {
  const query = ListLoansQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const conditions = [];
  if (query.data.status) conditions.push(eq(loansTable.status, query.data.status));
  if (query.data.propertyId) conditions.push(eq(loansTable.propertyId, Number(query.data.propertyId)));

  const rows = await db
    .select()
    .from(loansTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(loansTable.createdAt);

  res.json(rows.map(fmt));
});

router.post("/", async (req, res) => {
  const body = CreateLoanBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(loansTable)
    .values({ ...body.data, status: "pending" })
    .returning();

  await db.insert(activityTable).values({
    type: "loan_approved",
    description: `Loan application submitted for ${body.data.borrowerName}`,
    entityId: row.id,
    entityType: "loan",
  });

  res.status(201).json(fmt(row));
});

router.get("/:id", async (req, res) => {
  const params = GetLoanParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(loansTable)
    .where(eq(loansTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(fmt(row));
});

router.patch("/:id", async (req, res) => {
  const params = UpdateLoanParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateLoanBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [row] = await db
    .update(loansTable)
    .set(body.data)
    .where(eq(loansTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (body.data.status === "approved") {
    await db.insert(activityTable).values({
      type: "loan_approved",
      description: `Loan approved for ${row.borrowerName}`,
      entityId: row.id,
      entityType: "loan",
    });
  } else if (body.data.status === "rejected") {
    await db.insert(activityTable).values({
      type: "loan_rejected",
      description: `Loan rejected for ${row.borrowerName}`,
      entityId: row.id,
      entityType: "loan",
    });
  }

  res.json(fmt(row));
});

export default router;
