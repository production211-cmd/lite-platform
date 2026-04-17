import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
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
      // Navigate to home — App.tsx will redirect to the correct shell based on role
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        background: "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #2d2d2d 100%)",
      }}
    >
      {/* Logo */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="font-heading text-4xl tracking-[0.4em] text-white">LITE</h1>
        <div className="w-16 h-px bg-white/30 mx-auto my-3" />
        <p className="text-sm tracking-[0.3em] text-gray-400 uppercase font-body">Marketplace</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <h2 className="font-heading text-2xl small-caps mb-1">Sign in</h2>
        <p className="text-sm text-gray-400 font-body mb-6">Enter your credentials to access the platform</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-body">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent font-body"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-body">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent font-body"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 font-body"
            style={{ backgroundColor: "#232323" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3a3a3a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#232323"; }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 font-body">or</p>
          <button className="mt-2 text-sm text-gray-600 hover:text-gray-900 font-body transition-colors">
            First time here? <span className="font-semibold">Start Vendor Onboarding →</span>
          </button>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-2 font-body">Demo Accounts:</p>
          <div className="space-y-1.5 text-xs text-gray-500 font-body">
            <p><strong>Admin:</strong> ops@lordandtaylor.com / LiteAdmin2026!</p>
            <p><strong>Vendor:</strong> vendor@julian.com / VendorPass2026!</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-500 relative z-10 font-body">LITE Marketplace Platform</p>
    </div>
  );
}
