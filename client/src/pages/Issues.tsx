import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Shield, Clock, CheckCircle, XCircle,
  Search, Filter, Eye, MessageSquare, Flag, AlertOctagon,
  ChevronDown,
} from "lucide-react";

interface Issue {
  id: string;
  type: "FRAUD_HOLD" | "DISPUTE" | "SLA_BREACH" | "COMPLIANCE" | "QUALITY";
  title: string;
  description: string;
  vendor: string;
  orderId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "ESCALATED";
  createdAt: string;
  assignedTo?: string;
}

const MOCK_ISSUES: Issue[] = [
  { id: "ISS-001", type: "FRAUD_HOLD", title: "Suspicious high-value order from new customer", description: "Order #LT-2026-0089 — £4,200 order flagged by fraud detection. New customer, high-value items, express shipping.", vendor: "Julian Fashion", orderId: "LT-2026-0089", priority: "CRITICAL", status: "OPEN", createdAt: new Date(Date.now() - 3600000).toISOString(), assignedTo: "Sarah M." },
  { id: "ISS-002", type: "SLA_BREACH", title: "Shipping SLA exceeded — 72h without dispatch", description: "Order #LT-2026-0076 has not been shipped within the 48h SLA window.", vendor: "Deliberti", orderId: "LT-2026-0076", priority: "HIGH", status: "INVESTIGATING", createdAt: new Date(Date.now() - 86400000).toISOString(), assignedTo: "James C." },
  { id: "ISS-003", type: "DISPUTE", title: "Customer claims item not as described", description: "Customer received a Gucci bag that appears different from the product listing photos.", vendor: "Link2Lux", orderId: "LT-2026-0054", priority: "HIGH", status: "INVESTIGATING", createdAt: new Date(Date.now() - 172800000).toISOString(), assignedTo: "Emily R." },
  { id: "ISS-004", type: "COMPLIANCE", title: "Missing product authenticity certificates", description: "Batch of 15 products from Tessabit missing required authenticity documentation.", vendor: "Tessabit", priority: "MEDIUM", status: "OPEN", createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "ISS-005", type: "QUALITY", title: "High return rate on recent shipments", description: "Return rate for Spinnaker products has exceeded 15% threshold in the last 30 days.", vendor: "Spinnaker", priority: "MEDIUM", status: "OPEN", createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: "ISS-006", type: "FRAUD_HOLD", title: "Multiple orders from same IP with different cards", description: "3 orders placed within 10 minutes from the same IP address using 3 different payment methods.", vendor: "Modes", orderId: "LT-2026-0091", priority: "CRITICAL", status: "ESCALATED", createdAt: new Date(Date.now() - 7200000).toISOString(), assignedTo: "Sarah M." },
  { id: "ISS-007", type: "SLA_BREACH", title: "Tracking not updated for 5 days", description: "Shipment tracking for order #LT-2026-0068 has not been updated since dispatch.", vendor: "Julian Fashion", orderId: "LT-2026-0068", priority: "LOW", status: "RESOLVED", createdAt: new Date(Date.now() - 604800000).toISOString(), assignedTo: "James C." },
  { id: "ISS-008", type: "DISPUTE", title: "Wrong size delivered — customer requesting exchange", description: "Customer ordered size 42 but received size 44. Requesting immediate exchange.", vendor: "Deliberti", orderId: "LT-2026-0071", priority: "MEDIUM", status: "RESOLVED", createdAt: new Date(Date.now() - 432000000).toISOString() },
];

export default function Issues() {
  const [issues] = useState<Issue[]>(MOCK_ISSUES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filtered = useMemo(() => {
    let result = issues;
    if (typeFilter !== "all") result = result.filter((i) => i.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q) || i.vendor.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    return result;
  }, [issues, typeFilter, statusFilter, search]);

  const counts = {
    total: issues.length,
    open: issues.filter((i) => i.status === "OPEN").length,
    investigating: issues.filter((i) => i.status === "INVESTIGATING").length,
    escalated: issues.filter((i) => i.status === "ESCALATED").length,
    resolved: issues.filter((i) => i.status === "RESOLVED").length,
  };

  const typeColors: Record<string, string> = {
    FRAUD_HOLD: "bg-red-50 text-red-700",
    DISPUTE: "bg-orange-50 text-orange-700",
    SLA_BREACH: "bg-amber-50 text-amber-700",
    COMPLIANCE: "bg-purple-50 text-purple-700",
    QUALITY: "bg-blue-50 text-blue-700",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-gray-500",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    CRITICAL: "text-red-600",
  };

  const statusColors: Record<string, string> = {
    OPEN: "status-pending",
    INVESTIGATING: "status-processing",
    ESCALATED: "status-danger",
    RESOLVED: "status-delivered",
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Issues & Disputes</h1>
          <p className="text-sm text-gray-500 font-body mt-1">Manage fraud holds, disputes, SLA breaches, and compliance issues</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="kpi-card kpi-blue">
          <p className="text-lg font-bold font-body">{counts.total}</p>
          <p className="text-[10px] text-gray-500 font-body">Total Issues</p>
        </div>
        <div className="kpi-card kpi-orange">
          <p className="text-lg font-bold font-body">{counts.open}</p>
          <p className="text-[10px] text-gray-500 font-body">Open</p>
        </div>
        <div className="kpi-card kpi-purple">
          <p className="text-lg font-bold font-body">{counts.investigating}</p>
          <p className="text-[10px] text-gray-500 font-body">Investigating</p>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: "#ef4444" }}>
          <p className="text-lg font-bold font-body">{counts.escalated}</p>
          <p className="text-[10px] text-gray-500 font-body">Escalated</p>
        </div>
        <div className="kpi-card kpi-green">
          <p className="text-lg font-bold font-body">{counts.resolved}</p>
          <p className="text-[10px] text-gray-500 font-body">Resolved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="search-bar flex-1 max-w-sm">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-xs" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white">
          <option value="all">All Types</option>
          <option value="FRAUD_HOLD">Fraud Hold</option>
          <option value="DISPUTE">Dispute</option>
          <option value="SLA_BREACH">SLA Breach</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="QUALITY">Quality</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-body bg-white">
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Title</th>
              <th>Vendor</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Created</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => (
              <tr key={issue.id} className="cursor-pointer" onClick={() => setSelectedIssue(issue)}>
                <td className="text-xs font-mono font-body">{issue.id}</td>
                <td>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", typeColors[issue.type])}>
                    {issue.type.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="text-xs font-semibold font-body max-w-[250px] truncate">{issue.title}</td>
                <td className="text-xs font-body">{issue.vendor}</td>
                <td>
                  <span className={cn("text-[10px] font-bold", priorityColors[issue.priority])}>
                    {issue.priority}
                  </span>
                </td>
                <td><span className={`status-badge ${statusColors[issue.status]}`}>{issue.status}</span></td>
                <td className="text-xs font-body text-gray-500">{issue.assignedTo || "—"}</td>
                <td className="text-xs font-body text-gray-400">{formatDate(issue.createdAt)}</td>
                <td><button className="btn-view"><Eye size={12} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-body text-sm">No issues found</div>
        )}
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedIssue(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{selectedIssue.id}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", typeColors[selectedIssue.type])}>
                    {selectedIssue.type.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-sm font-bold font-heading">{selectedIssue.title}</h3>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 font-body mb-4">{selectedIssue.description}</p>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Vendor</span>
                <span className="font-medium">{selectedIssue.vendor}</span>
              </div>
              {selectedIssue.orderId && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">Order</span>
                  <span className="font-medium font-mono">{selectedIssue.orderId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Priority</span>
                <span className={cn("font-bold", priorityColors[selectedIssue.priority])}>{selectedIssue.priority}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Status</span>
                <span className={`status-badge ${statusColors[selectedIssue.status]}`}>{selectedIssue.status}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Assigned</span>
                <span>{selectedIssue.assignedTo || "Unassigned"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center justify-center gap-1.5">
                <MessageSquare size={12} /> Add Note
              </button>
              <button className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <Flag size={12} /> Escalate
              </button>
              <button className="flex-1 px-3 py-2 border border-green-200 text-green-700 rounded-lg text-xs font-semibold font-body hover:bg-green-50 flex items-center justify-center gap-1.5">
                <CheckCircle size={12} /> Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
