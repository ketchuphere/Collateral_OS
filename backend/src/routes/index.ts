import { Router, type IRouter } from "express";
import healthRouter from "./core/health";
import propertiesRouter from "./core/properties";
import assessmentsRouter from "./core/assessments";
import loansRouter from "./core/loans";
import alertsRouter from "./core/alerts";
import dashboardRouter from "./core/dashboard";
import aiChatRouter from "./ai/ai-chat";
import aiPortfolioSummaryRouter from "./ai/ai-portfolio-summary";
import aiCopilotRouter from "./ai/ai-copilot";

const router: IRouter = Router();

// ── Core domain routes ─────────────────────────────────────────────────────
router.use(healthRouter);
router.use("/properties", propertiesRouter);
router.use("/assessments", assessmentsRouter);
router.use("/loans", loansRouter);
router.use("/alerts", alertsRouter);
router.use("/dashboard", dashboardRouter);

// ── AI routes (SSE streaming) ──────────────────────────────────────────────
router.use("/ai-chat", aiChatRouter);
router.use("/ai-portfolio-summary", aiPortfolioSummaryRouter);
router.use("/ai-copilot", aiCopilotRouter);

export default router;
