import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateLoan, useListProperties, useListAssessments, getListLoansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatINR, propertyTypeLabel } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-1.5 text-xs bg-card border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

export default function NewLoan() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createLoan = useCreateLoan();

  const { data: properties } = useListProperties({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const { data: assessments } = useListAssessments(
    { propertyId: selectedPropertyId ?? undefined, status: "completed" },
    { query: { enabled: !!selectedPropertyId } }
  );

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);

  const [form, setForm] = useState({
    borrowerName: "",
    borrowerContact: "",
    loanAmount: "",
    requestedLtv: "",
    assessmentId: "",
    analystNotes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPropertyId || !form.borrowerName || !form.loanAmount || !form.requestedLtv) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const result = await createLoan.mutateAsync({
        data: {
          propertyId: selectedPropertyId,
          borrowerName: form.borrowerName,
          borrowerContact: form.borrowerContact || undefined,
          loanAmount: Number(form.loanAmount),
          requestedLtv: Number(form.requestedLtv),
          assessmentId: form.assessmentId ? Number(form.assessmentId) : undefined,
          analystNotes: form.analystNotes || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListLoansQueryKey() });
      navigate(`/loans/${result.id}`);
    } catch {
      setError("Failed to create loan application. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="New Loan Application"
        subtitle="Submit collateral for loan underwriting"
        action={
          <Link href="/loans">
            <a className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </a>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property selection */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Collateral Property</div>
              <Field label="Select Property" required>
                <select
                  className={inputClass}
                  value={selectedPropertyId ?? ""}
                  onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Choose a property</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address} — {propertyTypeLabel(p.propertyType)}, {p.city}
                    </option>
                  ))}
                </select>
              </Field>
              {selectedProperty?.estimatedValue && (
                <div className="text-xs text-muted-foreground bg-muted/20 rounded px-3 py-2">
                  Estimated Value: <span className="font-mono text-foreground">{formatINR(selectedProperty.estimatedValue)}</span>
                  {selectedProperty.liquidityScore != null && (
                    <span className="ml-3">Liquidity: <span className="font-mono text-foreground">{Math.round(selectedProperty.liquidityScore)}/100</span></span>
                  )}
                </div>
              )}
              {assessments && assessments.length > 0 && (
                <Field label="Link Assessment (optional)">
                  <select className={inputClass} value={form.assessmentId} onChange={set("assessmentId")}>
                    <option value="">No assessment linked</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        Assessment #{a.id} — {formatINR(a.valuationMid)} · Risk: {a.riskCategory ?? "—"}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            {/* Borrower details */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Borrower Details</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Borrower Name" required>
                  <input className={inputClass} placeholder="Full name" value={form.borrowerName} onChange={set("borrowerName")} />
                </Field>
                <Field label="Contact">
                  <input className={inputClass} placeholder="+91-XXXXXXXXXX" value={form.borrowerContact} onChange={set("borrowerContact")} />
                </Field>
              </div>
            </div>

            {/* Loan terms */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground">Loan Terms</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Loan Amount (₹)" required>
                  <input className={inputClass} type="number" placeholder="e.g. 5000000" value={form.loanAmount} onChange={set("loanAmount")} min="1" />
                </Field>
                <Field label="Requested LTV (%)" required>
                  <input className={inputClass} type="number" placeholder="e.g. 65" value={form.requestedLtv} onChange={set("requestedLtv")} min="1" max="100" />
                </Field>
              </div>
              <Field label="Analyst Notes">
                <textarea
                  className={inputClass + " resize-none"}
                  rows={3}
                  placeholder="Internal notes for underwriting team..."
                  value={form.analystNotes}
                  onChange={set("analystNotes")}
                />
              </Field>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={createLoan.isPending}
              className="w-full py-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createLoan.isPending ? "Submitting..." : "Submit Loan Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
