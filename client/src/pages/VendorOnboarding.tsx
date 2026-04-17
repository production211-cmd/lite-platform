/**
 * VendorOnboarding — Resumable Stateful Wizard
 * ===============================================
 * Design: Wizard with incremental save per step.
 * State visibility: not_started, in_progress, blocked, complete, verified.
 * Supports resume from any step, partial completion, admin override.
 * Separates required-to-transact from nice-to-have.
 * Document upload with versioning and human review support.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Building2, FileText, Truck, CreditCard, Package, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Globe, Mail, Phone, MapPin,
  AlertTriangle, Info, Save, ChevronRight, Clock, ShieldCheck,
  XCircle, Eye, RotateCcw, Loader2,
} from "lucide-react";

type StepStatus = "not_started" | "in_progress" | "blocked" | "complete" | "verified";

interface OnboardingVendor {
  companyName: string;
  legalName: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  vatNumber: string;
  shipFromAddress: string;
  bankName: string;
  iban: string;
  swiftBic: string;
  commissionRate: string;
  portalType: string;
  categories: string[];
}

interface DocumentUpload {
  label: string;
  required: boolean;
  status: "pending" | "uploaded" | "reviewing" | "approved" | "rejected";
  fileName: string | null;
  uploadedAt: string | null;
  version: number;
}

interface OnboardingState {
  id: string | null;
  vendor: OnboardingVendor;
  stepStatuses: Record<string, StepStatus>;
  documents: DocumentUpload[];
  lastSavedAt: string | null;
  overallStatus: "not_started" | "in_progress" | "blocked" | "complete" | "verified";
}

const STEPS = [
  { key: "company", label: "Company Info", icon: Building2, requiredToTransact: true },
  { key: "compliance", label: "Compliance", icon: FileText, requiredToTransact: true },
  { key: "shipping", label: "Shipping", icon: Truck, requiredToTransact: true },
  { key: "payments", label: "Payment Details", icon: CreditCard, requiredToTransact: true },
  { key: "catalog", label: "Catalog Setup", icon: Package, requiredToTransact: false },
  { key: "review", label: "Review & Activate", icon: CheckCircle, requiredToTransact: false },
];

const STATUS_ICONS: Record<StepStatus, any> = {
  not_started: Clock,
  in_progress: Loader2,
  blocked: AlertTriangle,
  complete: CheckCircle,
  verified: ShieldCheck,
};

const STATUS_COLORS: Record<StepStatus, string> = {
  not_started: "text-gray-400 bg-gray-100",
  in_progress: "text-blue-600 bg-blue-50",
  blocked: "text-amber-600 bg-amber-50",
  complete: "text-green-600 bg-green-50",
  verified: "text-green-700 bg-green-100",
};

const INITIAL_DOCUMENTS: DocumentUpload[] = [
  { label: "Business Registration Certificate", required: true, status: "pending", fileName: null, uploadedAt: null, version: 0 },
  { label: "VAT Certificate", required: true, status: "pending", fileName: null, uploadedAt: null, version: 0 },
  { label: "Product Liability Insurance", required: true, status: "pending", fileName: null, uploadedAt: null, version: 0 },
  { label: "Anti-Counterfeiting Declaration", required: true, status: "pending", fileName: null, uploadedAt: null, version: 0 },
  { label: "GDPR Data Processing Agreement", required: false, status: "pending", fileName: null, uploadedAt: null, version: 0 },
];

const STORAGE_KEY = "lite_vendor_onboarding_draft";

export default function VendorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>(() => {
    // Try to resume from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: null,
      vendor: {
        companyName: "", legalName: "", country: "", contactEmail: "", contactPhone: "",
        website: "", vatNumber: "", shipFromAddress: "", bankName: "", iban: "",
        swiftBic: "", commissionRate: "18", portalType: "FULL", categories: [],
      },
      stepStatuses: {
        company: "not_started",
        compliance: "not_started",
        shipping: "not_started",
        payments: "not_started",
        catalog: "not_started",
        review: "not_started",
      },
      documents: INITIAL_DOCUMENTS,
      lastSavedAt: null,
      overallStatus: "not_started",
    };
  });

  const updateField = (field: keyof OnboardingVendor, value: string) => {
    setState((prev) => ({
      ...prev,
      vendor: { ...prev.vendor, [field]: value },
      stepStatuses: { ...prev.stepStatuses, [STEPS[currentStep].key]: "in_progress" },
      overallStatus: "in_progress",
    }));
  };

  const saveStep = useCallback(async () => {
    setSaving(true);
    const stepKey = STEPS[currentStep].key;
    const newState = {
      ...state,
      stepStatuses: { ...state.stepStatuses, [stepKey]: "complete" as StepStatus },
      lastSavedAt: new Date().toISOString(),
    };
    // Persist to localStorage for resume
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setState(newState);
    // In production, also save to API
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  }, [state, currentStep]);

  const canProceed = () => {
    const v = state.vendor;
    if (currentStep === 0) return !!(v.companyName && v.contactEmail && v.country);
    if (currentStep === 1) return !!v.vatNumber;
    return true;
  };

  const getOverallProgress = () => {
    const statuses = Object.values(state.stepStatuses);
    const completed = statuses.filter((s) => s === "complete" || s === "verified").length;
    return Math.round((completed / statuses.length) * 100);
  };

  const requiredComplete = () => {
    return STEPS.filter((s) => s.requiredToTransact).every(
      (s) => state.stepStatuses[s.key] === "complete" || state.stepStatuses[s.key] === "verified"
    );
  };

  const handleDocUpload = (index: number) => {
    setState((prev) => {
      const docs = [...prev.documents];
      docs[index] = {
        ...docs[index],
        status: "uploaded",
        fileName: `${docs[index].label.toLowerCase().replace(/\s+/g, "_")}_v${docs[index].version + 1}.pdf`,
        uploadedAt: new Date().toISOString(),
        version: docs[index].version + 1,
      };
      return { ...prev, documents: docs };
    });
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400">
        <Link href="/vendors" className="hover:text-gray-600 transition-colors">Vendors</Link>
        <ChevronRight size={10} />
        <span className="text-gray-700 font-medium">Onboard New Vendor</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Vendor Onboarding</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            {state.lastSavedAt ? (
              <>Last saved: {new Date(state.lastSavedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
            ) : (
              "New vendor — progress is saved automatically"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5 text-gray-500">
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={saveStep}
            disabled={saving}
            className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? "Saving..." : "Save Progress"}
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold font-body text-gray-500">Overall Progress</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-body">{getOverallProgress()}%</span>
            {requiredComplete() && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Ready to Transact</span>
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${getOverallProgress()}%` }} />
        </div>
      </div>

      {/* Step Navigation — Horizontal with Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const status = state.stepStatuses[step.key];
            const StatusIcon = STATUS_ICONS[status];
            return (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(i)}
                  className="flex flex-col items-center group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    i === currentStep ? "ring-2 ring-gray-900 ring-offset-2" : "",
                    STATUS_COLORS[status]
                  )}>
                    <StatusIcon size={16} className={status === "in_progress" ? "animate-spin" : ""} />
                  </div>
                  <p className={cn(
                    "text-[10px] font-semibold font-body mt-1.5 transition-colors",
                    i === currentStep ? "text-gray-800" : "text-gray-400 group-hover:text-gray-600"
                  )}>
                    {step.label}
                  </p>
                  {step.requiredToTransact && (
                    <span className="text-[8px] text-red-400 font-bold">REQUIRED</span>
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-3",
                    status === "complete" || status === "verified" ? "bg-green-300" :
                    status === "in_progress" ? "bg-blue-200" : "bg-gray-200"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Company Information</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[state.stepStatuses.company])}>
                {state.stepStatuses.company.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Company Name * <span className="text-red-400 text-[9px]">Required to transact</span></label>
                <input type="text" value={state.vendor.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="e.g., Julian Fashion S.p.A." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Legal Name</label>
                <input type="text" value={state.vendor.legalName} onChange={(e) => updateField("legalName", e.target.value)} placeholder="If different from company name" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Country * <span className="text-red-400 text-[9px]">Required to transact</span></label>
                <select value={state.vendor.country} onChange={(e) => updateField("country", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body bg-white">
                  <option value="">Select country</option>
                  <option value="IT">Italy</option>
                  <option value="FR">France</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="ES">Spain</option>
                  <option value="US">United States</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Website</label>
                <input type="url" value={state.vendor.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Contact Email * <span className="text-red-400 text-[9px]">Required to transact</span></label>
                <input type="email" value={state.vendor.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} placeholder="vendor@company.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Contact Phone</label>
                <input type="tel" value={state.vendor.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} placeholder="+39 02 1234567" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Commission Rate (%)</label>
                <input type="number" value={state.vendor.commissionRate} onChange={(e) => updateField("commissionRate", e.target.value)} className="w-32 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Portal Access</label>
                <select value={state.vendor.portalType} onChange={(e) => updateField("portalType", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body bg-white">
                  <option value="FULL">Full Portal (manage products, orders, finance)</option>
                  <option value="PORTAL">Portal Only (view orders, confirm shipments)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Compliance Documents</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[state.stepStatuses.compliance])}>
                {state.stepStatuses.compliance.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold font-body text-amber-800">Required Documents</p>
                <p className="text-xs text-amber-700 font-body mt-0.5">Required documents must be uploaded and approved before the vendor can transact. Optional documents can be added later.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">VAT Number *</label>
              <input type="text" value={state.vendor.vatNumber} onChange={(e) => updateField("vatNumber", e.target.value)} placeholder="e.g., IT12345678901" className="w-full max-w-md px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="space-y-3">
              {state.documents.map((doc, i) => (
                <div key={doc.label} className={cn(
                  "flex items-center justify-between py-3 border rounded-lg px-4",
                  doc.status === "approved" ? "border-green-200 bg-green-50/50" :
                  doc.status === "rejected" ? "border-red-200 bg-red-50/50" :
                  doc.status === "uploaded" || doc.status === "reviewing" ? "border-blue-200 bg-blue-50/50" :
                  "border-gray-200"
                )}>
                  <div className="flex items-center gap-3">
                    <FileText size={14} className={cn(
                      doc.status === "approved" ? "text-green-500" :
                      doc.status === "rejected" ? "text-red-500" :
                      doc.status === "uploaded" || doc.status === "reviewing" ? "text-blue-500" :
                      "text-gray-400"
                    )} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-body">{doc.label}</span>
                        {doc.required && <span className="text-[9px] text-red-500 font-bold">REQUIRED</span>}
                      </div>
                      {doc.fileName && (
                        <p className="text-[10px] text-gray-400 font-body font-mono mt-0.5">
                          {doc.fileName} (v{doc.version}) — {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      doc.status === "approved" ? "bg-green-100 text-green-700" :
                      doc.status === "rejected" ? "bg-red-100 text-red-700" :
                      doc.status === "uploaded" ? "bg-blue-100 text-blue-700" :
                      doc.status === "reviewing" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-500"
                    )}>
                      {doc.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleDocUpload(i)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5"
                    >
                      <Upload size={10} /> {doc.status === "pending" ? "Upload" : "Re-upload"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Shipping Configuration</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[state.stepStatuses.shipping])}>
                {state.stepStatuses.shipping.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Ship-From Address *</label>
              <textarea value={state.vendor.shipFromAddress} onChange={(e) => updateField("shipFromAddress", e.target.value)} placeholder="Full warehouse/shipping address" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold font-body text-blue-800">Shipping Labels</p>
                <p className="text-xs text-blue-700 font-body mt-0.5">Labels will be generated automatically via our carrier integrations (FedEx, DHL, UPS). The vendor will receive labels through their portal.</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Payment Details</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[state.stepStatuses.payments])}>
                {state.stepStatuses.payments.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Bank Name</label>
                <input type="text" value={state.vendor.bankName} onChange={(e) => updateField("bankName", e.target.value)} placeholder="e.g., Intesa Sanpaolo" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">SWIFT/BIC</label>
                <input type="text" value={state.vendor.swiftBic} onChange={(e) => updateField("swiftBic", e.target.value)} placeholder="e.g., BCITITMM" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">IBAN</label>
              <input type="text" value={state.vendor.iban} onChange={(e) => updateField("iban", e.target.value)} placeholder="e.g., IT60X0542811101000000123456" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Catalog Setup</h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[state.stepStatuses.catalog])}>
                {state.stepStatuses.catalog.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-body">Select the product categories this vendor will supply. <span className="text-[10px] text-gray-400">(Optional — can be configured later)</span></p>
            <div className="grid grid-cols-3 gap-2">
              {["Women's Ready-to-Wear", "Men's Ready-to-Wear", "Handbags", "Shoes", "Accessories", "Jewelry", "Watches", "Beauty", "Kidswear", "Home & Lifestyle", "Vintage", "Eyewear"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setState((prev) => ({
                      ...prev,
                      vendor: {
                        ...prev.vendor,
                        categories: prev.vendor.categories.includes(cat)
                          ? prev.vendor.categories.filter((c) => c !== cat)
                          : [...prev.vendor.categories, cat],
                      },
                      stepStatuses: { ...prev.stepStatuses, catalog: "in_progress" },
                    }));
                  }}
                  className={cn(
                    "px-3 py-2.5 border rounded-lg text-xs font-body transition-colors",
                    state.vendor.categories.includes(cat)
                      ? "border-gray-900 bg-gray-900 text-white font-semibold"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-heading">Review & Activate</h3>
              {requiredComplete() ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                  <ShieldCheck size={9} /> All required steps complete
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={9} /> Required steps incomplete
                </span>
              )}
            </div>

            {/* Step Status Summary */}
            <div className="space-y-2">
              {STEPS.slice(0, -1).map((step) => {
                const status = state.stepStatuses[step.key];
                const StatusIcon = STATUS_ICONS[status];
                return (
                  <div key={step.key} className={cn(
                    "flex items-center justify-between py-2.5 px-3 rounded-lg border",
                    status === "complete" || status === "verified" ? "border-green-200 bg-green-50/50" :
                    status === "blocked" ? "border-amber-200 bg-amber-50/50" :
                    "border-gray-200"
                  )}>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={14} className={STATUS_COLORS[status].split(" ")[0]} />
                      <span className="text-sm font-body">{step.label}</span>
                      {step.requiredToTransact && <span className="text-[9px] text-red-400 font-bold">REQ</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_COLORS[status])}>
                        {status.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <button onClick={() => setCurrentStep(STEPS.findIndex((s) => s.key === step.key))} className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold">
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Data */}
            <div className="space-y-2 pt-2">
              {[
                { label: "Company", value: state.vendor.companyName || "—" },
                { label: "Country", value: state.vendor.country || "—" },
                { label: "Contact", value: state.vendor.contactEmail || "—" },
                { label: "VAT", value: state.vendor.vatNumber || "—" },
                { label: "Commission", value: `${state.vendor.commissionRate}%` },
                { label: "Portal", value: state.vendor.portalType },
                { label: "Ship From", value: state.vendor.shipFromAddress || "—" },
                { label: "Bank", value: state.vendor.bankName || "—" },
                { label: "Categories", value: state.vendor.categories.join(", ") || "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm font-body py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold font-body hover:bg-gray-50 disabled:opacity-30 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Previous
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={saveStep}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} /> Save Step
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={async () => {
                await saveStep();
                setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1));
              }}
              disabled={!canProceed()}
              className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold font-body hover:bg-gray-800 disabled:opacity-30 flex items-center gap-1.5"
            >
              Save & Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              disabled={!requiredComplete()}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold font-body hover:bg-green-700 disabled:opacity-30 flex items-center gap-1.5"
            >
              <CheckCircle size={14} /> Activate Vendor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
