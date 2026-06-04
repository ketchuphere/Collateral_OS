import { Router } from "express";
import { groq, DEFAULT_MODEL } from "../../lib/ai-client";
import { buildCopilotContext } from "../../services/copilot.service";

const router = Router();

const BASE_SYSTEM = `You are the CollateralOS AI Underwriting Copilot — an expert decision-support system embedded inside a secured lending platform used by banks and NBFCs in India.

Your role: help credit analysts, underwriters, and risk managers make fast, well-reasoned lending decisions. You have access to live portfolio data injected below.

## Expertise Areas
- Collateral risk assessment (residential, commercial, land, industrial)
- LTV recommendation and justification
- Fraud signal interpretation
- Market condition analysis (supply/demand, absorption velocity, micro-market trends)
- Recovery and liquidation scenarios
- Indian secured lending norms (RBI guidelines, SARFAESI, RERA)

## Response Style
- Be direct and confident — these are finance professionals
- Lead with the answer, then provide supporting bullet points
- For risk questions: always provide a recommended LTV range
- For fraud questions: state severity clearly and list specific evidence
- Use ₹ Cr notation (e.g., ₹12.5 Cr, not ₹12,500,000)
- Keep responses concise — 3–5 bullets max unless asked for detail
- When referencing portfolio data, cite the Property/Assessment/Loan ID

## Formatting Rules
- Use bullet points (•) for lists
- Prefix LTV recommendations with "Suggested LTV:"
- Prefix risk verdicts with "Risk Verdict:"
- For multi-part analysis, use bold section headers like **Market Conditions:**`;

router.post("/", async (req, res) => {
  const { messages } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const context = await buildCopilotContext();
    const systemPrompt = `${BASE_SYSTEM}\n\n${context}`;

    const stream = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
    res.end();
  }
});

export default router;
