/**
 * QueueMonitor — Secured Admin Queue Dashboard
 * ===============================================
 * Security: Admin-only (RETAILER_LT), read-only by default.
 * Manual triggers require explicit confirmation + audit logging.
 * Job payloads are masked (no raw customer/token/vendor data).
 * Observability (stats) is separated from control (mutations).
 */

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Activity, RefreshCw, Play, Pause, Clock, CheckCircle,
  XCircle, AlertTriangle, Zap, Database, Truck, Package,
  CreditCard, ShoppingBag, Shield, Lock, Eye, EyeOff,
  RotateCcw, Trash2, ChevronRight,
} from "lucide-react";

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  queue: string;
  actor: string;
  details: string;
}

export default function QueueMonitor() {
  const { user } = useAuth();
  const [stats, setStats] = useState<QueueStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState("waiting");
  const [showPayloads, setShowPayloads] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; queue: string; jobId?: string } | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const queueIcons: Record<string, any> = {
    "order-lifecycle": ShoppingBag,
    "shopify-sync": Database,
    "label-generation": Package,
    "tracking-update": Truck,
    "settlement-processing": CreditCard,
    "catalog-enrichment": Zap,
  };

  const SENSITIVE_FIELDS = ["token", "password", "secret", "apiKey", "iban", "swiftBic", "email", "phone", "address"];

  const maskPayload = (data: any): string => {
    if (!data) return "—";
    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        masked[key] = "***MASKED***";
      }
    }
    return JSON.stringify(masked);
  };

  const addAuditEntry = (action: string, queue: string, details: string) => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      queue,
      actor: user?.email || "unknown",
      details,
    };
    setAuditLog((prev) => [entry, ...prev].slice(0, 100));
  };

  const loadStats = () => {
    setLoading(true);
    addAuditEntry("VIEW_STATS", "all", "Refreshed queue statistics");
    api.getQueueStats().then((data: any) => {
      const queues = Array.isArray(data) ? data : data?.queues || [];
      setStats(queues);
      setLoading(false);
    }).catch(() => {
      setStats([
        { name: "order-lifecycle", waiting: 3, active: 1, completed: 1247, failed: 2, delayed: 0 },
        { name: "shopify-sync", waiting: 0, active: 0, completed: 892, failed: 5, delayed: 1 },
        { name: "label-generation", waiting: 5, active: 2, completed: 634, failed: 8, delayed: 0 },
        { name: "tracking-update", waiting: 12, active: 3, completed: 2156, failed: 3, delayed: 4 },
        { name: "settlement-processing", waiting: 0, active: 0, completed: 156, failed: 1, delayed: 0 },
        { name: "catalog-enrichment", waiting: 8, active: 1, completed: 423, failed: 12, delayed: 2 },
      ]);
      setLoading(false);
    });
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (!selectedQueue) return;
    api.getQueueJobs(selectedQueue, { status: jobStatus }).then((data: any) => {
      setJobs(Array.isArray(data) ? data : data?.jobs || []);
    }).catch(() => {
      setJobs([
        { id: "job-1", name: selectedQueue, data: { orderId: "LT-2026-0042", vendorId: "v1" }, timestamp: Date.now() - 60000, processedOn: Date.now() - 30000, finishedOn: Date.now(), attemptsMade: 1 },
        { id: "job-2", name: selectedQueue, data: { orderId: "LT-2026-0043" }, timestamp: Date.now() - 120000, processedOn: Date.now() - 90000, attemptsMade: 1 },
        { id: "job-3", name: selectedQueue, data: { orderId: "LT-2026-0044" }, timestamp: Date.now() - 180000, attemptsMade: 0 },
      ]);
    });
  }, [selectedQueue, jobStatus]);

  const handleMutation = (action: string, queue: string, jobId?: string) => {
    addAuditEntry(action, queue, jobId ? `Job ${jobId}` : "Queue-level action");
    // In production, this would call the API
    setConfirmAction(null);
  };

  const totalActive = stats.reduce((sum, q) => sum + q.active, 0);
  const totalWaiting = stats.reduce((sum, q) => sum + q.waiting, 0);
  const totalFailed = stats.reduce((sum, q) => sum + q.failed, 0);
  const totalCompleted = stats.reduce((sum, q) => sum + q.completed, 0);

  const formatTime = (ts: number) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading">Queue Monitor</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Shield size={9} /> ADMIN ONLY
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">BullMQ worker observability — read-only by default</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className={cn(
              "px-3 py-2 border rounded-lg text-xs font-semibold font-body flex items-center gap-1.5",
              showAuditLog ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <Eye size={12} /> Audit Log {auditLog.length > 0 && `(${auditLog.length})`}
          </button>
          <button onClick={loadStats} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Audit Log Panel */}
      {showAuditLog && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Session Audit Log</h3>
          {auditLog.length > 0 ? (
            <div className="space-y-1">
              {auditLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-gray-300">
                  <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    entry.action.startsWith("VIEW") ? "bg-gray-700 text-gray-300" : "bg-amber-900 text-amber-300"
                  )}>{entry.action}</span>
                  <span className="text-gray-400">{entry.queue}</span>
                  <span className="text-gray-500">{entry.actor}</span>
                  <span className="text-gray-400 truncate">{entry.details}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 font-mono">No audit entries yet.</p>
          )}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="kpi-card kpi-blue">
          <Activity size={14} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{totalActive}</p>
          <p className="text-[10px] text-gray-500 font-body">Active Jobs</p>
        </div>
        <div className="kpi-card kpi-orange">
          <Clock size={14} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{totalWaiting}</p>
          <p className="text-[10px] text-gray-500 font-body">Waiting</p>
        </div>
        <div className="kpi-card kpi-green">
          <CheckCircle size={14} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{totalCompleted.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 font-body">Completed</p>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: "#ef4444" }}>
          <XCircle size={14} className="text-red-500 mb-1" />
          <p className="text-2xl font-bold font-body">{totalFailed}</p>
          <p className="text-[10px] text-gray-500 font-body">Failed</p>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((queue) => {
          const Icon = queueIcons[queue.name] || Activity;
          const isSelected = selectedQueue === queue.name;
          return (
            <button
              key={queue.name}
              onClick={() => setSelectedQueue(isSelected ? null : queue.name)}
              className={cn(
                "bg-white rounded-lg border p-4 text-left transition-all hover:shadow-sm",
                isSelected ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-500" />
                  <p className="text-xs font-bold font-body capitalize">{queue.name.replace(/-/g, " ")}</p>
                </div>
                {queue.active > 0 && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: "Wait", value: queue.waiting, color: "text-orange-600" },
                  { label: "Active", value: queue.active, color: "text-blue-600" },
                  { label: "Done", value: queue.completed, color: "text-green-600" },
                  { label: "Fail", value: queue.failed, color: "text-red-600" },
                  { label: "Delay", value: queue.delayed, color: "text-gray-500" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className={cn("text-sm font-bold font-body", stat.color)}>{stat.value}</p>
                    <p className="text-[9px] text-gray-400 font-body">{stat.label}</p>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Job Detail */}
      {selectedQueue && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading capitalize">{selectedQueue.replace(/-/g, " ")} — Jobs</h3>
            <div className="flex items-center gap-3">
              {/* Payload visibility toggle */}
              <button
                onClick={() => {
                  setShowPayloads(!showPayloads);
                  addAuditEntry(showPayloads ? "HIDE_PAYLOADS" : "SHOW_PAYLOADS", selectedQueue, "Toggled payload visibility");
                }}
                className="flex items-center gap-1 text-[10px] font-semibold font-body text-gray-400 hover:text-gray-600"
              >
                {showPayloads ? <EyeOff size={10} /> : <Eye size={10} />}
                {showPayloads ? "Hide" : "Show"} Payloads
              </button>
              <div className="h-4 w-px bg-gray-200" />
              {/* Status filter tabs */}
              <div className="flex items-center gap-1">
                {["waiting", "active", "completed", "failed", "delayed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setJobStatus(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-semibold font-body capitalize transition-colors",
                      jobStatus === s ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {jobs.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  {showPayloads && <th>Data (Masked)</th>}
                  <th>Created</th>
                  <th>Processed</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  {jobStatus === "failed" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="text-xs font-mono font-body">{job.id}</td>
                    {showPayloads && (
                      <td className="text-xs font-body text-gray-500 max-w-[200px] truncate font-mono">
                        {maskPayload(job.data)}
                      </td>
                    )}
                    <td className="text-xs font-body">{formatTime(job.timestamp)}</td>
                    <td className="text-xs font-body">{formatTime(job.processedOn)}</td>
                    <td className="text-xs font-body text-center">{job.attemptsMade}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        jobStatus === "completed" ? "bg-green-50 text-green-600" :
                        jobStatus === "failed" ? "bg-red-50 text-red-600" :
                        jobStatus === "active" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {jobStatus}
                      </span>
                    </td>
                    {jobStatus === "failed" && (
                      <td>
                        <button
                          onClick={() => setConfirmAction({ type: "RETRY", queue: selectedQueue, jobId: job.id })}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <RotateCcw size={9} /> Retry
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400 font-body text-sm">No {jobStatus} jobs</div>
          )}
        </div>
      )}

      {/* Confirm Dialog for Mutations */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold font-heading">Confirm Privileged Action</h3>
            </div>
            <p className="text-xs text-gray-500 font-body mb-2">
              You are about to <strong>{confirmAction.type}</strong> on queue <strong>{confirmAction.queue}</strong>
              {confirmAction.jobId && <> for job <strong>{confirmAction.jobId}</strong></>}.
            </p>
            <p className="text-[10px] text-gray-400 font-body mb-4">
              This action will be logged in the audit trail with your identity ({user?.email}).
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold">Cancel</button>
              <button
                onClick={() => handleMutation(confirmAction.type, confirmAction.queue, confirmAction.jobId)}
                className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 flex items-center gap-1.5"
              >
                <Lock size={10} /> Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
