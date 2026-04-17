/**
 * ProductSubmission — Vendor Add/Edit Product Form
 * ==================================================
 * Multi-step product submission with image upload,
 * variant management, pricing, and compliance fields.
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Plus, Trash2,
  Package, DollarSign, Image as ImageIcon, Tag, FileText,
  AlertTriangle, Save, Send, ChevronRight,
} from "lucide-react";

interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  upc: string;
  price: string;
  compareAt: string;
  inventory: string;
  weight: string;
}

interface ProductForm {
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  materials: string;
  careInstructions: string;
  countryOfOrigin: string;
  hsCode: string;
  tags: string[];
  images: { id: string; url: string; alt: string; isPrimary: boolean }[];
  variants: Variant[];
  retailPrice: string;
  compareAtPrice: string;
  costPrice: string;
  shippingWeight: string;
  shippingClass: string;
  isFragile: boolean;
  requiresSignature: boolean;
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: Package },
  { id: 2, label: "Media", icon: ImageIcon },
  { id: 3, label: "Variants & Pricing", icon: DollarSign },
  { id: 4, label: "Shipping & Compliance", icon: FileText },
  { id: 5, label: "Review & Submit", icon: Send },
];

const CATEGORIES = [
  "Women's Apparel", "Men's Apparel", "Women's Shoes", "Men's Shoes",
  "Handbags", "Accessories", "Jewelry", "Beauty", "Home",
];

const SHIPPING_CLASSES = ["Standard", "Oversized", "Fragile", "Hazmat"];

const emptyVariant = (): Variant => ({
  id: crypto.randomUUID(),
  size: "",
  color: "",
  sku: "",
  upc: "",
  price: "",
  compareAt: "",
  inventory: "",
  weight: "",
});

export default function ProductSubmission() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ProductForm>({
    title: "",
    brand: user?.vendorName || "",
    category: "",
    subcategory: "",
    description: "",
    materials: "",
    careInstructions: "",
    countryOfOrigin: "",
    hsCode: "",
    tags: [],
    images: [],
    variants: [emptyVariant()],
    retailPrice: "",
    compareAtPrice: "",
    costPrice: "",
    shippingWeight: "",
    shippingClass: "Standard",
    isFragile: false,
    requiresSignature: false,
  });

  const [tagInput, setTagInput] = useState("");

  const updateField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      updateField("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const addVariant = () => {
    updateField("variants", [...form.variants, emptyVariant()]);
  };

  const removeVariant = (id: string) => {
    if (form.variants.length <= 1) return;
    updateField("variants", form.variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    updateField(
      "variants",
      form.variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const addDemoImages = () => {
    const demoImages = [
      { id: "img1", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400", alt: "Product front", isPrimary: true },
      { id: "img2", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", alt: "Product side", isPrimary: false },
      { id: "img3", url: "https://images.unsplash.com/photo-1558171813-01eda332a7b4?w=400", alt: "Product detail", isPrimary: false },
    ];
    updateField("images", demoImages);
  };

  const removeImage = (id: string) => {
    const updated = form.images.filter((i) => i.id !== id);
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0].isPrimary = true;
    }
    updateField("images", updated);
  };

  const setPrimaryImage = (id: string) => {
    updateField(
      "images",
      form.images.map((i) => ({ ...i, isPrimary: i.id === id }))
    );
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) errs.title = "Product title is required";
      if (!form.category) errs.category = "Category is required";
      if (!form.description.trim()) errs.description = "Description is required";
    }
    if (s === 2) {
      if (form.images.length === 0) errs.images = "At least one image is required";
    }
    if (s === 3) {
      if (form.variants.some((v) => !v.sku.trim())) errs.variants = "All variants need a SKU";
      if (form.variants.some((v) => !v.price)) errs.variantPrice = "All variants need a price";
    }
    if (s === 4) {
      if (!form.shippingWeight) errs.shippingWeight = "Shipping weight is required";
      if (!form.countryOfOrigin) errs.countryOfOrigin = "Country of origin is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) { setStep(4); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    navigate("/vendor/products");
  };

  const completionPct = Math.round(
    ([form.title, form.category, form.description, form.images.length > 0, form.variants[0]?.sku, form.shippingWeight, form.countryOfOrigin]
      .filter(Boolean).length / 7) * 100
  );

  return (
    <div className="page-enter p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/vendor/products" className="hover:text-gray-700 transition-colors">My Products</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">Add New Product</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Complete all steps to submit for review</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between" role="tablist" aria-label="Product submission steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  role="tab"
                  id={`step-tab-${s.id}`}
                  aria-selected={isActive}
                  aria-controls={`step-panel-${s.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => { if (isComplete || isActive) setStep(s.id); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-gray-900 text-white font-medium"
                      : isComplete
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "text-gray-400"
                  }`}
                >
                  {isComplete ? <Check size={16} /> : <Icon size={16} />}
                  <span className="hidden md:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${isComplete ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{completionPct}%</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 lg:p-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (<div role="tabpanel" id="step-panel-1" aria-labelledby="step-tab-1">
          <div className="space-y-6">
            <h2 className="font-heading text-lg tracking-wide text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., Silk Wrap Dress — Midnight Blue"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors ${errors.title ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${errors.category ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="Describe the product in detail — materials, fit, occasion, etc."
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none ${errors.description ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                <input
                  type="text"
                  value={form.materials}
                  onChange={(e) => updateField("materials", e.target.value)}
                  placeholder="e.g., 100% Silk"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={form.careInstructions}
                  onChange={(e) => updateField("careInstructions", e.target.value)}
                  placeholder="e.g., Dry clean only"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
                <button onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>)}

        {/* Step 2: Media */}
        {step === 2 && (<div role="tabpanel" id="step-panel-2" aria-labelledby="step-tab-2">
          <div className="space-y-6">
            <h2 className="font-heading text-lg tracking-wide text-gray-900 mb-4">Product Images</h2>
            {errors.images && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle size={16} />
                {errors.images}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img) => (
                <div key={img.id} className="space-y-1">
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                    <img src={img.url} alt={img.alt || "Product image"} className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded-full uppercase tracking-wider">Primary</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isPrimary && (
                        <button
                          onClick={() => setPrimaryImage(img.id)}
                          className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(img.id)}
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => updateField("images", form.images.map((i) => i.id === img.id ? { ...i, alt: e.target.value } : i))}
                    placeholder="Alt text"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    aria-label={`Alt text for image ${img.alt || img.id}`}
                  />
                </div>
              ))}
              <button
                onClick={addDemoImages}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Upload Images</span>
                <span className="text-[10px] text-gray-400 mt-1">or drag & drop</span>
              </button>
            </div>
            <p className="text-xs text-gray-400">Recommended: 2000x2000px, white background, max 8 images. First image is the hero.</p>
          </div>
        </div>)}

        {/* Step 3: Variants & Pricing */}
        {step === 3 && (<div role="tabpanel" id="step-panel-3" aria-labelledby="step-tab-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">Variants & Pricing</h2>
              <button
                onClick={addVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                <Plus size={14} />
                Add Variant
              </button>
            </div>
            {errors.variants && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle size={16} />{errors.variants}
              </div>
            )}
            {errors.variantPrice && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle size={16} />{errors.variantPrice}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Size</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Color</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">SKU *</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">UPC</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Price *</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Compare At</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Inventory</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Weight (oz)</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <input type="text" value={v.size} onChange={(e) => updateVariant(v.id, "size", e.target.value)} placeholder="S" className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={v.color} onChange={(e) => updateVariant(v.id, "color", e.target.value)} placeholder="Black" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={v.sku} onChange={(e) => updateVariant(v.id, "sku", e.target.value)} placeholder="SKU-001" className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={v.upc} onChange={(e) => updateVariant(v.id, "upc", e.target.value)} placeholder="012345678901" className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0" max="99999" step="0.01" value={v.price} onChange={(e) => updateVariant(v.id, "price", e.target.value)} placeholder="0.00" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0" max="99999" step="0.01" value={v.compareAt} onChange={(e) => updateVariant(v.id, "compareAt", e.target.value)} placeholder="0.00" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0" max="999999" step="1" value={v.inventory} onChange={(e) => updateVariant(v.id, "inventory", e.target.value)} placeholder="0" className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0" max="9999" step="0.1" value={v.weight} onChange={(e) => updateVariant(v.id, "weight", e.target.value)} placeholder="0" className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => removeVariant(v.id)}
                          disabled={form.variants.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

        {/* Step 4: Shipping & Compliance */}
        {step === 4 && (<div role="tabpanel" id="step-panel-4" aria-labelledby="step-tab-4">
          <div className="space-y-6">
            <h2 className="font-heading text-lg tracking-wide text-gray-900 mb-4">Shipping & Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Weight (oz) *</label>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  step="0.1"
                  value={form.shippingWeight}
                  onChange={(e) => updateField("shippingWeight", e.target.value)}
                  placeholder="e.g., 12"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${errors.shippingWeight ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.shippingWeight && <p className="text-xs text-red-500 mt-1">{errors.shippingWeight}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Class</label>
                <select
                  value={form.shippingClass}
                  onChange={(e) => updateField("shippingClass", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  {SHIPPING_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin *</label>
                <input
                  type="text"
                  value={form.countryOfOrigin}
                  onChange={(e) => updateField("countryOfOrigin", e.target.value)}
                  placeholder="e.g., Italy"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${errors.countryOfOrigin ? "border-red-400" : "border-gray-300"}`}
                />
                {errors.countryOfOrigin && <p className="text-xs text-red-500 mt-1">{errors.countryOfOrigin}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HS Code</label>
                <input
                  type="text"
                  value={form.hsCode}
                  onChange={(e) => updateField("hsCode", e.target.value)}
                  placeholder="e.g., 6204.43"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div className="md:col-span-2 flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFragile}
                    onChange={(e) => updateField("isFragile", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">Fragile item — requires special handling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresSignature}
                    onChange={(e) => updateField("requiresSignature", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">Requires signature on delivery</span>
                </label>
              </div>
            </div>
          </div>
        </div>)}

        {/* Step 5: Review & Submit */}
        {step === 5 && (<div role="tabpanel" id="step-panel-5" aria-labelledby="step-tab-5">
          <div className="space-y-6">
            <h2 className="font-heading text-lg tracking-wide text-gray-900 mb-4">Review & Submit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Title</dt><dd className="text-gray-900 font-medium">{form.title || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Brand</dt><dd className="text-gray-900">{form.brand || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd className="text-gray-900">{form.category || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Materials</dt><dd className="text-gray-900">{form.materials || "—"}</dd></div>
                </dl>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Media</h3>
                <div className="flex gap-2">
                  {form.images.slice(0, 4).map((img) => (
                    <img key={img.id} src={img.url} alt={img.alt} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                  ))}
                  {form.images.length === 0 && <p className="text-sm text-gray-400">No images uploaded</p>}
                </div>
                <p className="text-xs text-gray-500 mt-2">{form.images.length} image(s)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Variants</h3>
                <p className="text-sm text-gray-900">{form.variants.length} variant(s)</p>
                {form.variants.slice(0, 3).map((v) => (
                  <p key={v.id} className="text-xs text-gray-500">{v.size || "—"} / {v.color || "—"} — {v.sku || "No SKU"} — ${v.price || "0.00"}</p>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Shipping</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Weight</dt><dd className="text-gray-900">{form.shippingWeight ? `${form.shippingWeight} oz` : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Class</dt><dd className="text-gray-900">{form.shippingClass}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Origin</dt><dd className="text-gray-900">{form.countryOfOrigin || "—"}</dd></div>
                </dl>
              </div>
            </div>
            {completionPct < 100 && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertTriangle size={16} />
                Some required fields are incomplete. Please go back and fill them in before submitting.
              </div>
            )}
          </div>
        </div>)}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30"
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        {step < 5 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <Send size={16} />
            )}
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        )}
      </div>
    </div>
  );
}
