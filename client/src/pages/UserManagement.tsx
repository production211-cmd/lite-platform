/**
 * R7 Audit Fixes Applied:
 *  - 3A: Added error state with visible error banner
 *  - 4A: Modal role="dialog", aria-modal, aria-labelledby, focus management
 *  - 4B: All inputs have proper labels or aria-label
 *  - 2A: Create User modal (matches new POST / backend route)
 */
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Users, Shield, UserCheck, UserX, Search, Eye,
  MoreHorizontal, KeyRound, Power, PowerOff, X,
  AlertCircle, Plus, RefreshCw,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  vendorId: string | null;
  vendor: { id: string; name: string } | null;
  vendorAccess: { portalType: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  RETAILER_LT: "Admin",
  VENDOR_USER: "Vendor User",
  VENDOR: "Vendor",
};

const ROLE_COLORS: Record<string, string> = {
  RETAILER_LT: "bg-indigo-50 text-indigo-700",
  VENDOR_USER: "bg-emerald-50 text-emerald-700",
  VENDOR: "bg-amber-50 text-amber-700",
};

/* ── Focus-trap helper ── */
function useFocusTrap(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement;
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => {
      el.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return ref;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // R7-3A
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false); // R7-2A
  const [createForm, setCreateForm] = useState({ email: "", firstName: "", lastName: "", role: "VENDOR_USER", password: "" });
  const [createError, setCreateError] = useState<string | null>(null);

  // R7-4A: Focus trap refs
  const detailRef = useFocusTrap(!!selectedUser);
  const resetRef = useFocusTrap(!!resetModal);
  const createRef = useFocusTrap(createModal);

  const loadData = useCallback(async () => {
    try {
      setError(null); // R7-3A: clear previous error
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers(),
        api.getUserStats(),
      ]);
      setUsers(usersRes?.users || []);
      setStats(statsRes);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err?.message || "Failed to load users. Please try again."); // R7-3A
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all") result = result.filter((u) => statusFilter === "active" ? u.isActive : !u.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        u.email.toLowerCase().includes(q) ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        (u.vendor?.name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, roleFilter, statusFilter, search]);

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleToggleActive = async (user: User) => {
    setActionLoading(true);
    try {
      if (user.isActive) {
        await api.deactivateUser(user.id);
      } else {
        await api.activateUser(user.id);
      }
      await loadData();
    } catch (err) {
      console.error("Failed to toggle user:", err);
    }
    setActionLoading(false);
    setActionMenu(null);
  };

  const handleResetPassword = async () => {
    if (!resetModal || !newPassword || newPassword.length < 8) return;
    setActionLoading(true);
    try {
      await api.resetUserPassword(resetModal.id, newPassword);
      setResetModal(null);
      setNewPassword("");
    } catch (err) {
      console.error("Failed to reset password:", err);
    }
    setActionLoading(false);
  };

  // R7-2A: Create user handler
  const handleCreateUser = async () => {
    setCreateError(null);
    if (!createForm.email.trim() || !createForm.firstName.trim() || !createForm.lastName.trim()) {
      setCreateError("All name and email fields are required.");
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    setActionLoading(true);
    try {
      await api.createUser(createForm);
      setCreateModal(false);
      setCreateForm({ email: "", firstName: "", lastName: "", role: "VENDOR_USER", password: "" });
      await loadData();
    } catch (err: any) {
      const msg = err?.message || "Failed to create user.";
      setCreateError(msg.includes("409") || msg.includes("already exists") ? "A user with this email already exists." : msg);
    }
    setActionLoading(false);
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>User Management</h1>
          <p>Manage platform users, roles, and access</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* R7-3A: Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-body">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={loadData} className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card kpi-blue card-hover">
          <Users size={16} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats?.total || users.length}</p>
          <p className="text-xs text-gray-500 font-body">Total Users</p>
        </div>
        <div className="kpi-card kpi-purple card-hover">
          <Shield size={16} className="text-purple-500 mb-1" />
          <p className="text-2xl font-bold font-body">{roleCounts["RETAILER_LT"] || 0}</p>
          <p className="text-xs text-gray-500 font-body">Admins</p>
        </div>
        <div className="kpi-card kpi-green card-hover">
          <UserCheck size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats?.active || 0}</p>
          <p className="text-xs text-gray-500 font-body">Active</p>
        </div>
        <div className="kpi-card kpi-orange card-hover">
          <UserX size={16} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats?.inactive || 0}</p>
          <p className="text-xs text-gray-500 font-body">Inactive</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="search-bar flex-1 min-w-[280px]">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
            aria-label="Search users by name, email, or vendor"
          />
        </div>
        <label className="sr-only" htmlFor="role-filter">Filter by role</label>
        <select
          id="role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white"
        >
          <option value="all">All Roles</option>
          <option value="RETAILER_LT">Admin</option>
          <option value="VENDOR_USER">Vendor User</option>
          <option value="VENDOR">Vendor</option>
        </select>
        <label className="sr-only" htmlFor="status-filter">Filter by status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th className="w-20"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="group">
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <span className="text-sm font-semibold font-body">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </td>
                <td className="text-xs font-body text-gray-600">{user.email}</td>
                <td>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600")}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td className="text-xs font-body">{user.vendor?.name || "—"}</td>
                <td>
                  <span className={cn("status-badge", user.isActive ? "status-delivered" : "status-danger")}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="text-xs text-gray-500 font-body">{formatDate(user.lastLoginAt)}</td>
                <td className="text-xs text-gray-400 font-body">{formatDate(user.createdAt)}</td>
                <td>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === user.id ? null : user.id); }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={`Actions for ${user.firstName} ${user.lastName}`}
                    >
                      <MoreHorizontal size={14} className="text-gray-400" />
                    </button>
                    {actionMenu === user.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1" role="menu">
                        <button
                          role="menuitem"
                          onClick={() => { setSelectedUser(user); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-body hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye size={12} /> View Details
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => { setResetModal(user); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-body hover:bg-gray-50 flex items-center gap-2"
                        >
                          <KeyRound size={12} /> Reset Password
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          role="menuitem"
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoading}
                          className={cn(
                            "w-full px-3 py-2 text-left text-xs font-body flex items-center gap-2",
                            user.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"
                          )}
                        >
                          {user.isActive ? <><PowerOff size={12} /> Deactivate</> : <><Power size={12} /> Activate</>}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !error && (
          <div className="p-8 text-center text-gray-400 font-body text-sm">No users found</div>
        )}
      </div>

      <p className="text-xs text-gray-400 font-body">Showing {filtered.length} of {users.length} users</p>

      {/* User Detail Modal — R7-4A: ARIA attributes + focus trap */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
          role="presentation"
        >
          <div
            ref={detailRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <h3 id="user-detail-title" className="text-sm font-bold font-heading">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-xs text-gray-500 font-body">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Close user detail">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Role</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", ROLE_COLORS[selectedUser.role])}>
                  {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                </span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Status</span>
                <span className={cn("status-badge", selectedUser.isActive ? "status-delivered" : "status-danger")}>
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {selectedUser.vendor && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">Vendor</span>
                  <span className="font-medium">{selectedUser.vendor.name}</span>
                </div>
              )}
              {selectedUser.vendorAccess && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">Portal Type</span>
                  <span className="font-medium">{selectedUser.vendorAccess.portalType}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Last Login</span>
                <span>{formatDate(selectedUser.lastLoginAt)}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Created</span>
                <span>{formatDate(selectedUser.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setResetModal(selectedUser); setSelectedUser(null); }}
                className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center justify-center gap-1.5"
              >
                <KeyRound size={12} /> Reset Password
              </button>
              <button
                onClick={() => { handleToggleActive(selectedUser); setSelectedUser(null); }}
                disabled={actionLoading}
                className={cn(
                  "flex-1 px-3 py-2 border rounded-lg text-xs font-semibold font-body flex items-center justify-center gap-1.5",
                  selectedUser.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"
                )}
              >
                {selectedUser.isActive ? <><PowerOff size={12} /> Deactivate</> : <><Power size={12} /> Activate</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal — R7-4A + R7-4B */}
      {resetModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => { setResetModal(null); setNewPassword(""); }}
          role="presentation"
        >
          <div
            ref={resetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reset-password-title" className="text-sm font-bold font-heading mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 font-body mb-4">
              Set a new password for <strong>{resetModal.firstName} {resetModal.lastName}</strong> ({resetModal.email})
            </p>
            <label htmlFor="new-password" className="block text-xs font-semibold text-gray-700 font-body mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body mb-4"
              aria-describedby="password-hint"
              autoComplete="new-password"
            />
            <p id="password-hint" className="sr-only">Password must be at least 8 characters</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setResetModal(null); setNewPassword(""); }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading || newPassword.length < 8}
                className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 disabled:opacity-50"
              >
                {actionLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R7-2A: Create User Modal */}
      {createModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => { setCreateModal(false); setCreateError(null); }}
          role="presentation"
        >
          <div
            ref={createRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="create-user-title" className="text-sm font-bold font-heading">Create New User</h3>
              <button onClick={() => { setCreateModal(false); setCreateError(null); }} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Close create user dialog">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {createError && (
              <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-body">
                <AlertCircle size={14} className="flex-shrink-0" />
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-first" className="block text-xs font-semibold text-gray-700 font-body mb-1">First Name</label>
                  <input
                    id="create-first"
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body"
                  />
                </div>
                <div>
                  <label htmlFor="create-last" className="block text-xs font-semibold text-gray-700 font-body mb-1">Last Name</label>
                  <input
                    id="create-last"
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="create-email" className="block text-xs font-semibold text-gray-700 font-body mb-1">Email</label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body"
                />
              </div>
              <div>
                <label htmlFor="create-role" className="block text-xs font-semibold text-gray-700 font-body mb-1">Role</label>
                <select
                  id="create-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body bg-white"
                >
                  <option value="VENDOR_USER">Vendor User</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="RETAILER_LT">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="create-password" className="block text-xs font-semibold text-gray-700 font-body mb-1">Password</label>
                <input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body"
                  autoComplete="new-password"
                  aria-describedby="create-password-hint"
                />
                <p id="create-password-hint" className="text-[10px] text-gray-400 mt-1 font-body">Minimum 8 characters</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => { setCreateModal(false); setCreateError(null); }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={actionLoading}
                className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 disabled:opacity-50"
              >
                {actionLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away handler for action menu */}
      {actionMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}
