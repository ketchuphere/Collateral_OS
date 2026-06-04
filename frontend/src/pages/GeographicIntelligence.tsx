import { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useListProperties } from "@workspace/api-client-react";
import { useListAssessments } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { MapPin, Droplets, TrendingUp, ShieldCheck, Building2 } from "lucide-react";

// ─── City coordinates (India) ─────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "mumbai":     [19.076,  72.877],
  "delhi":      [28.704,  77.102],
  "new delhi":  [28.613,  77.209],
  "bengaluru":  [12.972,  77.594],
  "bangalore":  [12.972,  77.594],
  "gurugram":   [28.459,  77.026],
  "gurgaon":    [28.459,  77.026],
  "hyderabad":  [17.385,  78.487],
  "chennai":    [13.083,  80.270],
  "pune":       [18.520,  73.856],
  "kolkata":    [22.572,  88.363],
  "ahmedabad":  [23.023,  72.572],
  "jaipur":     [26.913,  75.787],
  "noida":      [28.536,  77.391],
  "lucknow":    [26.847,  80.947],
  "surat":      [21.170,  72.831],
  "kochi":      [ 9.931,  76.267],
  "indore":     [22.719,  75.857],
  "bhopal":     [23.259,  77.413],
  "chandigarh": [30.733,  76.779],
  "nagpur":     [21.145,  79.089],
  "visakhapatnam": [17.686, 83.218],
};

// Major Indian cities shown as reference (no data)
const REFERENCE_CITIES: Array<{ name: string; coords: [number, number] }> = [
  { name: "Mumbai",    coords: [19.076, 72.877] },
  { name: "Delhi",     coords: [28.704, 77.102] },
  { name: "Bengaluru", coords: [12.972, 77.594] },
  { name: "Hyderabad", coords: [17.385, 78.487] },
  { name: "Chennai",   coords: [13.083, 80.270] },
  { name: "Kolkata",   coords: [22.572, 88.363] },
  { name: "Pune",      coords: [18.520, 73.856] },
  { name: "Ahmedabad", coords: [23.023, 72.572] },
  { name: "Jaipur",    coords: [26.913, 75.787] },
  { name: "Lucknow",   coords: [26.847, 80.947] },
  { name: "Surat",     coords: [21.170, 72.831] },
  { name: "Nagpur",    coords: [21.145, 79.089] },
  { name: "Kochi",     coords: [ 9.931, 76.267] },
  { name: "Chandigarh", coords: [30.733, 76.779] },
];

// ─── Score helpers ────────────────────────────────────────────────────────────
type ScoreMode = "liquidity" | "demand" | "recovery";

function deriveScores(liquidityScore: number, confidenceScore: number, fraudRiskScore: number) {
  const liquidity = liquidityScore;
  const demand    = Math.min(100, Math.round(liquidityScore * 0.55 + (100 - fraudRiskScore) * 0.35 + confidenceScore * 0.10));
  const recovery  = Math.min(100, Math.round(confidenceScore * 0.45 + liquidityScore * 0.35 + (100 - fraudRiskScore) * 0.20));
  return { liquidity, demand, recovery };
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#14b8a6";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
  if (score >= 65) return "bg-teal-400/10 text-teal-400 border-teal-400/20";
  if (score >= 50) return "bg-amber-400/10 text-amber-400 border-amber-400/20";
  if (score >= 35) return "bg-orange-400/10 text-orange-400 border-orange-400/20";
  return "bg-red-400/10 text-red-400 border-red-400/20";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Weak";
  return "Critical";
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
// react-leaflet v4 needs this shim in Vite
function fixLeafletIcons() {
  // no-op: we only use CircleMarker so no icon issue
}
fixLeafletIcons();

// ─── City data aggregation ────────────────────────────────────────────────────
interface CityData {
  city: string;
  coords: [number, number];
  propertyCount: number;
  liquidity: number;
  demand: number;
  recovery: number;
}

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODES: Array<{ id: ScoreMode; label: string; icon: typeof Droplets; desc: string }> = [
  { id: "liquidity", label: "Liquidity Score",  icon: Droplets,    desc: "Speed of collateral liquidation at fair market value" },
  { id: "demand",    label: "Demand Score",     icon: TrendingUp,  desc: "Estimated market absorption strength in the micro-market" },
  { id: "recovery",  label: "Recovery Score",   icon: ShieldCheck, desc: "Confidence-weighted recovery certainty in default scenarios" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GeographicIntelligence() {
  const [mode, setMode] = useState<ScoreMode>("liquidity");
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const { data: properties } = useListProperties();
  const { data: assessments } = useListAssessments();

  // Build city → assessment scores map
  const cityData = useMemo<CityData[]>(() => {
    if (!properties || !assessments) return [];

    // Map propertyId → assessment
    const assessmentByProp: Record<number, typeof assessments[0]> = {};
    for (const a of assessments) {
      if (!assessmentByProp[a.propertyId] || a.id > assessmentByProp[a.propertyId].id) {
        assessmentByProp[a.propertyId] = a;
      }
    }

    // Group by city
    const byCityMap: Record<string, { props: number; liq: number[]; conf: number[]; fraud: number[] }> = {};
    for (const p of properties) {
      const cityKey = p.city.toLowerCase().trim();
      if (!byCityMap[cityKey]) byCityMap[cityKey] = { props: 0, liq: [], conf: [], fraud: [] };
      byCityMap[cityKey].props++;

      const a = assessmentByProp[p.id];
      if (a) {
        byCityMap[cityKey].liq.push(a.liquidityScore ?? 50);
        byCityMap[cityKey].conf.push(a.confidenceScore ?? 50);
        byCityMap[cityKey].fraud.push(a.fraudRiskScore ?? 30);
      }
    }

    const result: CityData[] = [];
    for (const [cityKey, data] of Object.entries(byCityMap)) {
      const coords = CITY_COORDS[cityKey];
      if (!coords) continue;

      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 55;
      const liq  = avg(data.liq);
      const conf = avg(data.conf);
      const fraud = avg(data.fraud);
      const scores = deriveScores(liq, conf, fraud);

      // Infer display name
      const displayName = Object.keys(CITY_COORDS).find(k => k === cityKey);
      const prettyName = displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : cityKey;

      result.push({
        city: prettyName,
        coords,
        propertyCount: data.props,
        ...scores,
      });
    }

    return result.sort((a, b) => b[mode] - a[mode]);
  }, [properties, assessments, mode]);

  // Which reference cities don't have real data
  const dataCityNames = new Set(cityData.map(c => c.city.toLowerCase()));
  const bgCities = REFERENCE_CITIES.filter(r => !dataCityNames.has(r.name.toLowerCase()));

  const activeMode = MODES.find(m => m.id === mode)!;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Geographic Intelligence</div>
            <div className="text-[10px] text-muted-foreground">Location-based collateral risk across India</div>
          </div>
        </div>
        {/* Score mode tabs */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 border border-border">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                mode === m.id
                  ? "bg-card text-foreground border border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon className="w-3 h-3" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Map */}
        <div className="relative flex-1 min-h-0" style={{ minHeight: 380 }}>
          <MapContainer
            center={[20.5, 78.9]}
            zoom={5}
            style={{ height: "100%", width: "100%", background: "#0f1117" }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CartoDB"
            />

            {/* Background reference cities (no data) */}
            {bgCities.map(city => (
              <CircleMarker
                key={city.name}
                center={city.coords}
                radius={6}
                pathOptions={{ color: "#334155", fillColor: "#334155", fillOpacity: 0.25, weight: 1 }}
              >
                <LeafletTooltip direction="top" offset={[0, -6]}>
                  <div className="text-xs text-slate-400 font-medium">{city.name}</div>
                  <div className="text-[10px] text-slate-500">No portfolio data</div>
                </LeafletTooltip>
              </CircleMarker>
            ))}

            {/* Active city circles */}
            {cityData.map(city => {
              const score = city[mode];
              const color = scoreColor(score);
              const isHovered = hoveredCity === city.city;
              const radius = Math.max(10, Math.min(28, 8 + (score / 100) * 20));

              return (
                <CircleMarker
                  key={city.city}
                  center={city.coords}
                  radius={isHovered ? radius + 4 : radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.55,
                    weight: isHovered ? 2 : 1.5,
                  }}
                  eventHandlers={{
                    mouseover: () => setHoveredCity(city.city),
                    mouseout: () => setHoveredCity(null),
                  }}
                >
                  <LeafletTooltip direction="top" offset={[0, -radius]} permanent={false}>
                    <div style={{ minWidth: 140 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{city.city}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                        {city.propertyCount} propert{city.propertyCount === 1 ? "y" : "ies"} in portfolio
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 1 }}>
                        <span style={{ color: "#94a3b8" }}>Liquidity</span>
                        <span style={{ fontWeight: 600, color: scoreColor(city.liquidity) }}>{city.liquidity}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 1 }}>
                        <span style={{ color: "#94a3b8" }}>Demand</span>
                        <span style={{ fontWeight: 600, color: scoreColor(city.demand) }}>{city.demand}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: "#94a3b8" }}>Recovery</span>
                        <span style={{ fontWeight: 600, color: scoreColor(city.recovery) }}>{city.recovery}</span>
                      </div>
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Overlay: score description */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 border border-border rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <activeMode.icon className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">{activeMode.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground max-w-48 leading-relaxed">{activeMode.desc}</p>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 border border-border rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] text-muted-foreground mb-1.5 font-medium">Score Range</div>
            {[
              { label: "80–100 Excellent", color: "#10b981" },
              { label: "65–79 Good",       color: "#14b8a6" },
              { label: "50–64 Moderate",   color: "#f59e0b" },
              { label: "35–49 Weak",       color: "#f97316" },
              { label: "0–34 Critical",    color: "#ef4444" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-600/40" />
              <span className="text-[10px] text-muted-foreground/60">No portfolio data</span>
            </div>
          </div>
        </div>

        {/* City ranking cards */}
        {cityData.length > 0 && (
          <div className="flex-shrink-0 border-t border-border px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Portfolio Cities — Ranked by {activeMode.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {cityData.map((city, i) => {
                const score = city[mode];
                return (
                  <div
                    key={city.city}
                    className={cn(
                      "rounded-lg border bg-card px-3 py-2.5 space-y-1.5 transition-colors cursor-default",
                      hoveredCity === city.city ? "border-primary/40" : "border-border"
                    )}
                    onMouseEnter={() => setHoveredCity(city.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground/60 font-mono">#{i + 1}</span>
                        <span className="text-xs font-medium text-foreground">{city.city}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", scoreBg(score))}>
                        {scoreLabel(score)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{city.propertyCount} propert{city.propertyCount === 1 ? "y" : "ies"}</span>
                      <span className="font-mono font-semibold text-foreground">{score}<span className="text-muted-foreground font-normal">/100</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
