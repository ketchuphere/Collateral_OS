import { describe, it, expect } from "vitest";
import {
  generateAssessmentData,
  FRAUD_ALERT_THRESHOLD,
  FRAUD_HIGH_SEVERITY_THRESHOLD,
} from "../../backend/src/services/assessment.service";

describe("generateAssessmentData", () => {
  const RUNS = 50; // run multiple times to catch randomness-related edge cases

  it("returns all required fields", () => {
    const result = generateAssessmentData(1000);
    expect(result).toHaveProperty("valuationMin");
    expect(result).toHaveProperty("valuationMax");
    expect(result).toHaveProperty("valuationMid");
    expect(result).toHaveProperty("confidenceScore");
    expect(result).toHaveProperty("liquidityScore");
    expect(result).toHaveProperty("liquidityLabel");
    expect(result).toHaveProperty("resaleCertainty");
    expect(result).toHaveProperty("recoveryCertainty");
    expect(result).toHaveProperty("recommendedLtv");
    expect(result).toHaveProperty("riskCategory");
    expect(result).toHaveProperty("fraudRiskScore");
    expect(result).toHaveProperty("underwritingInsights");
    expect(result).toHaveProperty("marketIntelligence");
    expect(result).toHaveProperty("geospatialNotes");
  });

  it("valuationMin < valuationMid < valuationMax", () => {
    for (let i = 0; i < RUNS; i++) {
      const r = generateAssessmentData(1500);
      expect(r.valuationMin).toBeLessThan(r.valuationMid);
      expect(r.valuationMid).toBeLessThan(r.valuationMax);
    }
  });

  it("confidenceScore is between 65 and 95", () => {
    for (let i = 0; i < RUNS; i++) {
      const r = generateAssessmentData(1000);
      expect(r.confidenceScore).toBeGreaterThanOrEqual(65);
      expect(r.confidenceScore).toBeLessThanOrEqual(95);
    }
  });

  it("liquidityScore is between 30 and 80", () => {
    for (let i = 0; i < RUNS; i++) {
      const r = generateAssessmentData(1000);
      expect(r.liquidityScore).toBeGreaterThanOrEqual(30);
      expect(r.liquidityScore).toBeLessThanOrEqual(80);
    }
  });

  it("recommendedLtv is one of 50, 60, 70", () => {
    for (let i = 0; i < RUNS; i++) {
      const r = generateAssessmentData(1000);
      expect([50, 60, 70]).toContain(r.recommendedLtv);
    }
  });

  it("riskCategory is one of low / moderate / high", () => {
    for (let i = 0; i < RUNS; i++) {
      const r = generateAssessmentData(2000);
      expect(["low", "moderate", "high"]).toContain(r.riskCategory);
    }
  });

  it("low risk maps to 70% LTV", () => {
    // Force a low-risk result by mocking Math.random — not done here,
    // instead we verify the relationship holds in the function logic
    for (let i = 0; i < RUNS * 2; i++) {
      const r = generateAssessmentData(1000);
      if (r.riskCategory === "low") {
        expect(r.recommendedLtv).toBe(70);
      } else if (r.riskCategory === "moderate") {
        expect(r.recommendedLtv).toBe(60);
      } else if (r.riskCategory === "high") {
        expect(r.recommendedLtv).toBe(50);
      }
    }
  });

  it("narrative fields are non-empty strings", () => {
    const r = generateAssessmentData(2500);
    expect(r.underwritingInsights.length).toBeGreaterThan(20);
    expect(r.marketIntelligence.length).toBeGreaterThan(20);
    expect(r.geospatialNotes.length).toBeGreaterThan(20);
  });

  it("scales valuation proportionally with area", () => {
    // Larger area should produce larger valuation on average
    const small = Array.from({ length: 20 }, () => generateAssessmentData(500).valuationMid);
    const large = Array.from({ length: 20 }, () => generateAssessmentData(5000).valuationMid);
    const avgSmall = small.reduce((a, b) => a + b, 0) / small.length;
    const avgLarge = large.reduce((a, b) => a + b, 0) / large.length;
    expect(avgLarge).toBeGreaterThan(avgSmall);
  });
});

describe("FRAUD thresholds", () => {
  it("FRAUD_ALERT_THRESHOLD is 40", () => {
    expect(FRAUD_ALERT_THRESHOLD).toBe(40);
  });

  it("FRAUD_HIGH_SEVERITY_THRESHOLD is greater than FRAUD_ALERT_THRESHOLD", () => {
    expect(FRAUD_HIGH_SEVERITY_THRESHOLD).toBeGreaterThan(FRAUD_ALERT_THRESHOLD);
  });
});
