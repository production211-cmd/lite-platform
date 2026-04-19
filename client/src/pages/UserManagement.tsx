import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Users, Shield, UserCheck, UserX, Search, Eye,
  MoreHorizontal, KeyRound, Power, PowerOff, X,
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

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [resetModal, setResetModal] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers(),
        api.getUserStats(),
      ]);
      setUsers(usersRes?.users || []);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load users:", err);
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
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage platform users, roles, and access</p>
      </div>

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
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white"
        >
          <option value="all">All Roles</option>
          <option value="RETAILER_LT">Admin</option>
          <option value="VENDOR_USER">Vendor User</option>
          <option value="VENDOR">Vendor</option>
        </select>
        <select
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
              <th className="w-20"></th>
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
                    >
                      <MoreHorizontal size={14} className="text-gray-400" />
                    </button>
                    {actionMenu === user.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                        <button
                          onClick={() => { setSelectedUser(user); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-body hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye size={12} /> View Details
                        </button>
                        <button
                          onClick={() => { setResetModal(user); setActionMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs font-body hover:bg-gray-50 flex items-center gap-2"
                        >
                          <KeyRound size={12} /> Reset Password
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
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
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-body text-sm">No users found</div>
        )}
      </div>

      <p className="text-xs text-gray-400 font-body">Showing {filtered.length} of {users.length} users</p>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-xs text-gray-500 font-body">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
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

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setResetModal(null); setNewPassword(""); }}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold font-heading mb-1">Reset Password</h3>
            <p className="text-xs text-gray-500 font-body mb-4">
              Set a new password for <strong>{resetModal.firstName} {resetModal.lastName}</strong> ({resetModal.email})
            </p>
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body mb-4"
            />
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

      {/* Click-away handler for action menu */}
      {actionMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}
