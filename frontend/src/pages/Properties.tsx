import { useState } from "react";
import { Link } from "wouter";
import { useListProperties } from "@workspace/api-client-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/widgets/Badge";
import {
  formatINR,
  formatScore,
  riskBadgeClass,
  statusBadgeClass,
  propertyTypeLabel,
  timeAgo,
  scoreColor,
  cn,
} from "@/lib/utils";
import { Plus, Search, Building2 } from "lucide-react";

export default function Properties() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const { data: properties, isLoading } = useListProperties(
    { search: search || undefined, riskCategory: riskFilter || undefined },
    { query: { refetchInterval: 5000 } }
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Collateral Portfolio"
        subtitle={`${properties?.length ?? 0} properties registered`}
        action={
          <Link href="/properties/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            Register Collateral
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-2.5 py-1.5 text-xs bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Property</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Location</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Est. Value</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Liquidity</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Risk</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : properties?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-muted-foreground">No properties found</div>
                    <Link href="/properties/new" className="text-primary hover:underline mt-1 inline-block">Register a collateral property</Link>
                  </td>
                </tr>
              ) : (
                properties?.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/properties/${p.id}`} className="text-primary hover:underline font-medium truncate max-w-[200px] block">{p.address}</Link>
                      {p.ownerName && <div className="text-muted-foreground text-[10px]">{p.ownerName}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{propertyTypeLabel(p.propertyType)}</td>
                    <td className="px-4 py-2.5 text-foreground">{p.city}, {p.state}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatINR(p.estimatedValue)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {p.liquidityScore != null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", scoreColor(p.liquidityScore))} style={{ width: `${p.liquidityScore}%` }} />
                          </div>
                          <span className="font-mono text-foreground">{Math.round(p.liquidityScore)}</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.riskCategory ? (
                        <Badge className={riskBadgeClass(p.riskCategory)}>{p.riskCategory}</Badge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={statusBadgeClass(p.status)}>{p.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{timeAgo(p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
