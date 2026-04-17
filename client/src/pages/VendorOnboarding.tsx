import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Building2, FileText, Truck, CreditCard, Package, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Globe, Mail, Phone, MapPin,
  AlertTriangle, Info,
} from "lucide-react";

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

const STEPS = [
  { key: "company", label: "Company Info", icon: Building2 },
  { key: "compliance", label: "Compliance", icon: FileText },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "payments", label: "Payment Details", icon: CreditCard },
  { key: "catalog", label: "Catalog Setup", icon: Package },
  { key: "review", label: "Review & Activate", icon: CheckCircle },
];

export default function VendorOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [vendor, setVendor] = useState<OnboardingVendor>({
    companyName: "", legalName: "", country: "", contactEmail: "", contactPhone: "",
    website: "", vatNumber: "", shipFromAddress: "", bankName: "", iban: "",
    swiftBic: "", commissionRate: "18", portalType: "FULL", categories: [],
  });

  const updateField = (field: keyof OnboardingVendor, value: string) => {
    setVendor((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (currentStep === 0) return vendor.companyName && vendor.contactEmail && vendor.country;
    return true;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold font-heading">Vendor Onboarding</h1>
        <p className="text-sm text-gray-500 font-body mt-1">Add a new vendor to the marketplace</p>
      </div>

      {/* Step Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  i < currentStep ? "bg-green-100 text-green-600" :
                  i === currentStep ? "bg-gray-900 text-white" :
                  "bg-gray-100 text-gray-400"
                )}>
                  {i < currentStep ? <CheckCircle size={16} /> : <step.icon size={16} />}
                </div>
                <p className={cn(
                  "text-[10px] font-semibold font-body mt-1.5",
                  i <= currentStep ? "text-gray-800" : "text-gray-400"
                )}>{step.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-3", i < currentStep ? "bg-green-300" : "bg-gray-200")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === 0 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold font-heading">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Company Name *</label>
                <input type="text" value={vendor.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="e.g., Julian Fashion S.p.A." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Legal Name</label>
                <input type="text" value={vendor.legalName} onChange={(e) => updateField("legalName", e.target.value)} placeholder="If different from company name" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Country *</label>
                <select value={vendor.country} onChange={(e) => updateField("country", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body bg-white">
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
                <input type="url" value={vendor.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Contact Email *</label>
                <input type="email" value={vendor.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} placeholder="vendor@company.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Contact Phone</label>
                <input type="tel" value={vendor.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} placeholder="+39 02 1234567" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Commission Rate (%)</label>
                <input type="number" value={vendor.commissionRate} onChange={(e) => updateField("commissionRate", e.target.value)} className="w-32 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Portal Access</label>
                <select value={vendor.portalType} onChange={(e) => updateField("portalType", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body bg-white">
                  <option value="FULL">Full Portal (manage products, orders, finance)</option>
                  <option value="PORTAL">Portal Only (view orders, confirm shipments)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold font-heading">Compliance Documents</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold font-body text-amber-800">Required Documents</p>
                <p className="text-xs text-amber-700 font-body mt-0.5">The following documents must be uploaded before the vendor can be activated.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">VAT Number</label>
              <input type="text" value={vendor.vatNumber} onChange={(e) => updateField("vatNumber", e.target.value)} placeholder="e.g., IT12345678901" className="w-full max-w-md px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="space-y-3">
              {[
                { label: "Business Registration Certificate", required: true },
                { label: "VAT Certificate", required: true },
                { label: "Product Liability Insurance", required: true },
                { label: "Anti-Counterfeiting Declaration", required: true },
                { label: "GDPR Data Processing Agreement", required: false },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-sm font-body">{doc.label}</span>
                    {doc.required && <span className="text-[9px] text-red-500 font-bold">REQUIRED</span>}
                  </div>
                  <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                    <Upload size={10} /> Upload
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold font-heading">Shipping Configuration</h3>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Ship-From Address</label>
              <textarea value={vendor.shipFromAddress} onChange={(e) => updateField("shipFromAddress", e.target.value)} placeholder="Full warehouse/shipping address" rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
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
            <h3 className="text-sm font-bold font-heading">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Bank Name</label>
                <input type="text" value={vendor.bankName} onChange={(e) => updateField("bankName", e.target.value)} placeholder="e.g., Intesa Sanpaolo" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">SWIFT/BIC</label>
                <input type="text" value={vendor.swiftBic} onChange={(e) => updateField("swiftBic", e.target.value)} placeholder="e.g., BCITITMM" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">IBAN</label>
              <input type="text" value={vendor.iban} onChange={(e) => updateField("iban", e.target.value)} placeholder="e.g., IT60X0542811101000000123456" className="w-full max-w-lg px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold font-heading">Catalog Setup</h3>
            <p className="text-sm text-gray-500 font-body">Select the product categories this vendor will supply.</p>
            <div className="grid grid-cols-3 gap-2">
              {["Women's Ready-to-Wear", "Men's Ready-to-Wear", "Handbags", "Shoes", "Accessories", "Jewelry", "Watches", "Beauty", "Kidswear", "Home & Lifestyle", "Vintage", "Eyewear"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setVendor((prev) => ({
                      ...prev,
                      categories: prev.categories.includes(cat)
                        ? prev.categories.filter((c) => c !== cat)
                        : [...prev.categories, cat],
                    }));
                  }}
                  className={cn(
                    "px-3 py-2.5 border rounded-lg text-xs font-body transition-colors",
                    vendor.categories.includes(cat)
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
            <h3 className="text-sm font-bold font-heading">Review & Activate</h3>
            <div className="space-y-3">
              {[
                { label: "Company", value: vendor.companyName || "—" },
                { label: "Country", value: vendor.country || "—" },
                { label: "Contact", value: vendor.contactEmail || "—" },
                { label: "VAT", value: vendor.vatNumber || "—" },
                { label: "Commission", value: `${vendor.commissionRate}%` },
                { label: "Portal", value: vendor.portalType },
                { label: "Ship From", value: vendor.shipFromAddress || "—" },
                { label: "Bank", value: vendor.bankName || "—" },
                { label: "Categories", value: vendor.categories.join(", ") || "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm font-body py-2 border-b border-gray-50">
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
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canProceed()}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold font-body hover:bg-gray-800 disabled:opacity-30 flex items-center gap-1.5"
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold font-body hover:bg-green-700 flex items-center gap-1.5">
            <CheckCircle size={14} /> Activate Vendor
          </button>
        )}
      </div>
    </div>
  );
}
