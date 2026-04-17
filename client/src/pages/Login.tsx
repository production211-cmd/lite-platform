import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8a45c] flex items-center justify-center">
              <span className="text-white font-bold text-lg">LT</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-wide">LITE</h1>
              <p className="text-[11px] text-slate-400 tracking-[0.3em] uppercase">Marketplace Platform</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Multi-Vendor Marketplace<br />
            <span className="text-[#c8a45c]">Management System</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Manage vendors, products, orders, shipping, and finance across your
            entire marketplace ecosystem. Built for Lord & Taylor's global
            luxury retail operations.
          </p>
        </div>

        <div className="flex items-center gap-6 text-slate-500 text-xs">
          <span>12 Active Vendors</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>402K+ Products</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>7,800+ Orders</span>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#fafbfc]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#c8a45c] flex items-center justify-center">
              <span className="text-white font-bold text-lg">LT</span>
            </div>
            <div>
              <h1 className="font-bold text-xl">LITE</h1>
              <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase">Marketplace</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your LITE Platform account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45c] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45c] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0f172a] text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-[var(--border)]">
            <p className="text-xs font-medium text-slate-600 mb-2">Demo Accounts:</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p><strong>Admin:</strong> syenel@lordandtaylor.com / LiteAdmin2026!</p>
              <p><strong>Vendor:</strong> vendor@julian.com / VendorPass2026!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
