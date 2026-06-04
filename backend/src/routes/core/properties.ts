import { Router } from "express";
import { db } from "@collateral-os/db";
import { propertiesTable } from "@collateral-os/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListPropertiesQueryParams,
  CreatePropertyBody,
  UpdatePropertyBody,
  GetPropertyParams,
  UpdatePropertyParams,
  DeletePropertyParams,
} from "@collateral-os/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListPropertiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { status, riskCategory, search } = query.data;
  const conditions = [];
  if (status) conditions.push(eq(propertiesTable.status, status));
  if (riskCategory) conditions.push(eq(propertiesTable.riskCategory, riskCategory));
  if (search) conditions.push(ilike(propertiesTable.address, `%${search}%`));

  const rows = await db
    .select()
    .from(propertiesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(propertiesTable.createdAt);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const body = CreatePropertyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(propertiesTable)
    .values({ ...body.data, status: "pending" })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const params = GetPropertyParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const params = UpdatePropertyParams.safeParse({ id: Number(req.params.id) });
  const body = UpdatePropertyBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [row] = await db
    .update(propertiesTable)
    .set(body.data)
    .where(eq(propertiesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const params = DeletePropertyParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(propertiesTable).where(eq(propertiesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
