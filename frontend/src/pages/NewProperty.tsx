import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProperty, getListPropertiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const PROPERTY_TYPES = [
  { value: "residential_apartment", label: "Residential Apartment" },
  { value: "residential_villa", label: "Residential Villa" },
  { value: "commercial_office", label: "Commercial Office" },
  { value: "commercial_retail", label: "Commercial Retail" },
  { value: "land", label: "Land / Plot" },
  { value: "industrial", label: "Industrial" },
];

const STATES = [
  "Andhra Pradesh", "Delhi", "Goa", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

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

export default function NewProperty() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createProperty = useCreateProperty();

  const [form, setForm] = useState({
    address: "",
    propertyType: "",
    city: "",
    state: "",
    area: "",
    ownerName: "",
    ownerContact: "",
  });

  const [error, setError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.address || !form.propertyType || !form.city || !form.state || !form.area) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const result = await createProperty.mutateAsync({
        data: {
          address: form.address,
          propertyType: form.propertyType,
          city: form.city,
          state: form.state,
          area: Number(form.area),
          ownerName: form.ownerName || undefined,
          ownerContact: form.ownerContact || undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
      navigate(`/properties/${result.id}`);
    } catch {
      setError("Failed to register property. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Register Collateral"
        subtitle="Add a new property for AI assessment"
        action={
          <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground mb-1">Property Details</div>
              <Field label="Address" required>
                <input className={inputClass} placeholder="Full property address" value={form.address} onChange={set("address")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Property Type" required>
                  <select className={inputClass} value={form.propertyType} onChange={set("propertyType")}>
                    <option value="">Select type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Area (sq. ft.)" required>
                  <input className={inputClass} type="number" placeholder="e.g. 1200" value={form.area} onChange={set("area")} min="1" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required>
                  <input className={inputClass} placeholder="e.g. Mumbai" value={form.city} onChange={set("city")} />
                </Field>
                <Field label="State" required>
                  <select className={inputClass} value={form.state} onChange={set("state")}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium text-foreground mb-1">Owner Information</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Owner Name">
                  <input className={inputClass} placeholder="Owner full name" value={form.ownerName} onChange={set("ownerName")} />
                </Field>
                <Field label="Owner Contact">
                  <input className={inputClass} placeholder="+91-XXXXXXXXXX" value={form.ownerContact} onChange={set("ownerContact")} />
                </Field>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={createProperty.isPending}
              className="w-full py-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createProperty.isPending ? "Registering..." : "Register Property"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
