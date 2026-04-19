import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  AlertTriangle, Clock, CheckCircle, XCircle,
  Search, Eye, MessageSquare, Flag, RefreshCw,
  ChevronLeft, ChevronRight, Send,
} from "lucide-react";

interface Thread {
  id: string;
  vendorId: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  assignedToId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  slaDeadline: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: { id: string; name: string };
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  messages: { id: string; content: string; senderId: string; isInternal: boolean; createdAt: string }[];
  _count: { messages: number };
}

interface Stats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  urgent: number;
  slaBreach: number;
}

export default function Issues() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, pending: 0, resolved: 0, urgent: 0, slaBreach: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (departmentFilter !== "all") params.set("department", departmentFilter);
      if (search.trim()) params.set("search", search.trim());

      const [threadsRes, statsRes] = await Promise.all([
        api.getMessageThreads(Object.fromEntries(params)),
        api.getMessageStats(),
      ]);
      setThreads(threadsRes.threads || []);
      setTotal(threadsRes.total || 0);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, departmentFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (threadId: string, newStatus: string) => {
    try {
      await api.updateThreadStatus(threadId, newStatus);
      fetchData();
      if (selectedThread?.id === threadId) {
        setSelectedThread((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(selectedThread.id, {
        senderId: "admin",
        content: replyText.trim(),
        isInternal: false,
      });
      setReplyText("");
      // Refresh thread detail
      const updated = await api.getMessageThread(selectedThread.id);
      setSelectedThread(updated);
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSending(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const priorityColors: Record<string, string> = {
    LOW: "text-gray-500",
    NORMAL: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-red-600",
  };

  const statusColors: Record<string, string> = {
    OPEN: "status-pending",
    PENDING: "status-processing",
    RESOLVED: "status-delivered",
    CLOSED: "status-cancelled",
  };

  const departmentLabels: Record<string, string> = {
    CATALOG_BUYER: "Catalog / Buyer",
    RMS: "RMS",
    OPERATIONS: "Operations",
    OPS: "Operations",
    FINANCE: "Finance",
    SUPPORT: "Support",
    CX: "Customer Experience",
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isSlaBreached = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Issues & Disputes</h1>
          <p className="text-sm text-gray-500 font-body mt-1">Manage message threads, SLA breaches, and vendor communications</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-xs font-body font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-3">
        <div className="kpi-card kpi-blue">
          <p className="text-lg font-bold font-body">{stats.total}</p>
          <p className="text-[10px] text-gray-500 font-body">Total Threads</p>
        </div>
        <div className="kpi-card kpi-orange">
          <p className="text-lg font-bold font-body">{stats.open}</p>
          <p className="text-[10px] text-gray-500 font-body">Open</p>
        </div>
        <div className="kpi-card kpi-purple">
          <p className="text-lg font-bold font-body">{stats.pending}</p>
          <p className="text-[10px] text-gray-500 font-body">Pending</p>
        </div>
        <div className="kpi-card kpi-green">
          <p className="text-lg font-bold font-body">{stats.resolved}</p>
          <p className="text-[10px] text-gray-500 font-body">Resolved</p>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: "#ef4444" }}>
          <p className="text-lg font-bold font-body">{stats.urgent}</p>
          <p className="text-[10px] text-gray-500 font-body">Urgent</p>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="text-lg font-bold font-body">{stats.slaBreach}</p>
          <p className="text-[10px] text-gray-500 font-body">SLA Breached</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="search-bar flex-1 max-w-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search by subject, vendor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="text-xs" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white">
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white">
          <option value="all">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white">
          <option value="all">All Departments</option>
          <option value="CATALOG_BUYER">Catalog / Buyer</option>
          <option value="RMS">RMS</option>
          <option value="OPERATIONS">Operations</option>
          <option value="FINANCE">Finance</option>
          <option value="SUPPORT">Support</option>
        </select>
      </div>

      {/* Threads Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Loading threads...</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Vendor</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Assigned</th>
                  <th>Messages</th>
                  <th>Updated</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id} className="cursor-pointer" onClick={() => setSelectedThread(thread)}>
                    <td className="text-xs font-semibold font-body max-w-[220px] truncate">{thread.subject}</td>
                    <td className="text-xs font-body">{thread.vendor?.name || "—"}</td>
                    <td className="text-xs font-body text-gray-500">{departmentLabels[thread.department] || thread.department}</td>
                    <td>
                      <span className={cn("text-[10px] font-bold", priorityColors[thread.priority] || "text-gray-500")}>
                        {thread.priority}
                      </span>
                    </td>
                    <td><span className={`status-badge ${statusColors[thread.status] || "status-pending"}`}>{thread.status}</span></td>
                    <td>
                      {thread.slaDeadline ? (
                        <span className={cn("text-[10px] font-bold flex items-center gap-1", isSlaBreached(thread.slaDeadline) ? "text-red-600" : "text-green-600")}>
                          {isSlaBreached(thread.slaDeadline) ? <AlertTriangle size={10} /> : <Clock size={10} />}
                          {isSlaBreached(thread.slaDeadline) ? "Breached" : "On Track"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-xs font-body text-gray-500">
                      {thread.assignedTo ? `${thread.assignedTo.firstName} ${thread.assignedTo.lastName}` : "Unassigned"}
                    </td>
                    <td className="text-xs font-body text-gray-500 text-center">{thread._count?.messages || 0}</td>
                    <td className="text-xs font-body text-gray-400">{formatDate(thread.updatedAt)}</td>
                    <td><button className="btn-view"><Eye size={12} /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {threads.length === 0 && (
              <div className="p-8 text-center text-gray-400 font-body text-sm">No threads found</div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-body">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} threads
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 text-xs font-body">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Thread Detail Modal */}
      {selectedThread && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedThread(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`status-badge ${statusColors[selectedThread.status] || "status-pending"}`}>{selectedThread.status}</span>
                    <span className={cn("text-[10px] font-bold", priorityColors[selectedThread.priority])}>{selectedThread.priority}</span>
                    {selectedThread.slaDeadline && isSlaBreached(selectedThread.slaDeadline) && (
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5"><AlertTriangle size={10} /> SLA Breached</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold font-heading truncate">{selectedThread.subject}</h3>
                  <p className="text-[11px] text-gray-500 font-body mt-0.5">
                    {selectedThread.vendor?.name} &middot; {departmentLabels[selectedThread.department] || selectedThread.department}
                    {selectedThread.assignedTo && ` · Assigned to ${selectedThread.assignedTo.firstName} ${selectedThread.assignedTo.lastName}`}
                  </p>
                </div>
                <button onClick={() => setSelectedThread(null)} className="p-1 hover:bg-gray-100 rounded-lg ml-2 flex-shrink-0">
                  <XCircle size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedThread.messages && selectedThread.messages.length > 0 ? (
                selectedThread.messages.map((msg) => (
                  <div key={msg.id} className={cn("p-3 rounded-lg text-xs font-body", msg.isInternal ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 border border-gray-100")}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-700">{msg.senderId === "admin" ? "Admin" : "Vendor"}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                    {msg.isInternal && <span className="text-[9px] text-yellow-600 font-bold mt-1 inline-block">INTERNAL NOTE</span>}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 text-xs font-body py-4">No messages yet</p>
              )}
            </div>

            {/* Reply + Actions */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              {/* Reply input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 disabled:opacity-40 flex items-center gap-1"
                >
                  <Send size={12} /> {sending ? "..." : "Send"}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {selectedThread.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleStatusChange(selectedThread.id, "RESOLVED")}
                    className="flex-1 px-3 py-2 border border-green-200 text-green-700 rounded-lg text-xs font-semibold font-body hover:bg-green-50 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={12} /> Resolve
                  </button>
                )}
                {selectedThread.status !== "CLOSED" && (
                  <button
                    onClick={() => handleStatusChange(selectedThread.id, "CLOSED")}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={12} /> Close
                  </button>
                )}
                {selectedThread.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange(selectedThread.id, "OPEN")}
                    className="flex-1 px-3 py-2 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold font-body hover:bg-blue-50 flex items-center justify-center gap-1.5"
                  >
                    <Flag size={12} /> Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
