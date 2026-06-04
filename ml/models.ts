/**
 * ML (Machine Learning) Layer
 * ============================
 *
 * CURRENT IMPLEMENTATION — Statistical Simulation Layer
 * -------------------------------------------------------
 * The assessment engine in CollateralOS currently uses a statistical
 * simulation to generate property scores. This is intentional for the
 * v1 / demo build and allows the full platform to function without
 * requiring a trained model or external data feeds.
 *
 * Location: backend/src/services/assessment.service.ts
 * Function: generateAssessmentData(area: number)
 *
 * Outputs simulated:
 *   - valuationMin / valuationMid / valuationMax  (area × rand rate per sqft)
 *   - confidenceScore  (65–95)
 *   - liquidityScore   (30–80)
 *   - fraudRiskScore   (0–25 base)
 *   - riskCategory     (derived from scores)
 *   - recommendedLtv   (50 / 60 / 70 based on risk)
 *   - Three narrative strings (template-generated)
 *
 *
 * PRODUCTION ML ARCHITECTURE (planned)
 * ---------------------------------------
 * Replace the simulation layer with trained models:
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Model 1: AVM (Automated Valuation Model)            │
 *  │  Algorithm: XGBoost / LightGBM                       │
 *  │  Inputs:    area, city, property_type, floor, age,   │
 *  │             nearby_amenities, days_on_market          │
 *  │  Outputs:   valuation_min, valuation_mid, valuation_max│
 *  │  Training:  RERA transaction data, MagicBricks feeds  │
 *  └──────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Model 2: Fraud Classifier                           │
 *  │  Algorithm: Gradient Boosted Trees / Isolation Forest│
 *  │  Inputs:    price_vs_comparable, size_vs_satellite,  │
 *  │             owner_history, transaction_velocity       │
 *  │  Outputs:   fraud_risk_score (0–100), fraud_type     │
 *  │  Training:  Historical fraud case labels              │
 *  └──────────────────────────────────────────────────────┘
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Model 3: Liquidity Predictor                        │
 *  │  Algorithm: Time-series regression (ARIMA / Prophet) │
 *  │  Inputs:    city, property_type, quarter, macro_gdp  │
 *  │  Outputs:   liquidity_score, expected_days_to_sell   │
 *  │  Training:  Days-on-market data by city/type          │
 *  └──────────────────────────────────────────────────────┘
 *
 *
 * SWAP GUIDE
 * ----------
 * To swap the simulation for a real model:
 * 1. Implement one of the IMLModel classes below
 * 2. Replace the call in generateAssessmentData() with your model's predict()
 * 3. No changes needed in routes, services, or frontend
 */

export interface IMLModel<TInput, TOutput> {
  predict(input: TInput): Promise<TOutput>;
  batchPredict(inputs: TInput[]): Promise<TOutput[]>;
}

export interface AVMInput {
  area: number;
  city: string;
  propertyType: string;
  floor?: number;
  ageYears?: number;
}

export interface AVMOutput {
  valuationMin: number;
  valuationMid: number;
  valuationMax: number;
  confidenceScore: number;
}

export interface FraudInput {
  declaredArea: number;
  satelliteArea?: number;
  declaredValue: number;
  comparableValue: number;
  ownerTransactionHistory?: number;
}

export interface FraudOutput {
  fraudRiskScore: number;
  fraudType?: string;
  signals: string[];
}

export interface LiquidityInput {
  city: string;
  propertyType: string;
  estimatedValue: number;
}

export interface LiquidityOutput {
  liquidityScore: number;
  liquidityLabel: string;
  expectedDaysToSell: number;
}
