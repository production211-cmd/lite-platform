import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { timeAgo, cn, getInitials, truncate } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, KPICard } from "@/components/ui-components";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare, Search, Send, Paperclip, Clock, AlertCircle,
  User, Filter, ChevronDown, Star, Tag,
} from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params: Record<string, string> = {};
        if (deptFilter) params.department = deptFilter;
        const [t, s] = await Promise.all([
          api.getMessageThreads(params),
          api.getMessageStats(),
        ]);
        setThreads(t.threads);
        setStats(s);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [deptFilter]);

  const loadThread = async (id: string) => {
    try {
      const thread = await api.getMessageThread(id);
      setSelectedThread(thread);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMsg = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return;
    try {
      await api.sendMessage(selectedThread.id, {
        senderId: user.id,
        content: newMessage,
      });
      setNewMessage("");
      loadThread(selectedThread.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deptColors: Record<string, string> = {
    OPS: "bg-blue-100 text-blue-700",
    RMS: "bg-purple-100 text-purple-700",
    CX: "bg-emerald-100 text-emerald-700",
    CATALOG_BUYER: "bg-amber-100 text-amber-700",
    VENDOR_SUPPORT: "bg-rose-100 text-rose-700",
  };

  const priorityColors: Record<string, string> = {
    LOW: "text-slate-400",
    NORMAL: "text-blue-500",
    HIGH: "text-amber-500",
    URGENT: "text-red-500",
  };

  return (
    <div>
      <TopBar title="Messages Hub" subtitle="Team communication & vendor support" />

      <div className="p-6 animate-fade-in">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard title="Total Threads" value={stats?.total || 0} format="number" icon={MessageSquare} iconColor="text-blue-600" />
          <KPICard title="Open" value={stats?.open || 0} format="number" icon={Clock} iconColor="text-amber-600" />
          <KPICard title="Pending" value={stats?.pending || 0} format="number" icon={AlertCircle} iconColor="text-orange-600" />
          <KPICard title="Resolved" value={stats?.resolved || 0} format="number" icon={Star} iconColor="text-emerald-600" />
          <KPICard title="SLA Breaches" value={stats?.slaBreach || 0} format="number" icon={AlertCircle} iconColor="text-red-600" />
        </div>

        {/* 3-column layout */}
        <div className="flex bg-white rounded-xl border border-[var(--border)] overflow-hidden" style={{ height: "calc(100vh - 320px)" }}>
          {/* Left: Thread list */}
          <div className="w-80 border-r border-[var(--border)] flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-[var(--border)] space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-8 pr-3 py-1.5 border border-[var(--border)] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-[var(--border)] rounded-md text-xs bg-white"
              >
                <option value="">All Departments</option>
                <option value="OPS">Operations</option>
                <option value="RMS">RMS</option>
                <option value="CX">Customer Experience</option>
                <option value="CATALOG_BUYER">Catalog/Buyer</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {threads.map((thread) => {
                const isSlaBreach = thread.slaDeadline && new Date(thread.slaDeadline) < new Date() && thread.status !== "RESOLVED" && thread.status !== "CLOSED";
                return (
                  <div
                    key={thread.id}
                    onClick={() => loadThread(thread.id)}
                    className={cn(
                      "p-3 border-b border-[var(--border)] cursor-pointer hover:bg-slate-50 transition-colors",
                      selectedThread?.id === thread.id && "bg-slate-50 border-l-2 border-l-[#c8a45c]"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", deptColors[thread.department] || "bg-slate-100 text-slate-600")}>
                          {thread.department}
                        </span>
                        {isSlaBreach && <AlertCircle size={12} className="text-red-500" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{timeAgo(thread.updatedAt)}</span>
                    </div>
                    <p className="text-xs font-medium truncate">{thread.subject}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-500">{thread.vendor?.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", priorityColors[thread.priority]?.replace("text-", "bg-") || "bg-slate-300")} />
                        <StatusBadge status={thread.status} size="xs" />
                      </div>
                    </div>
                    {thread.messages?.[0] && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {truncate(thread.messages[0].content, 60)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Message detail */}
          {selectedThread ? (
            <div className="flex-1 flex flex-col">
              {/* Thread header */}
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{selectedThread.subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", deptColors[selectedThread.department] || "bg-slate-100")}>
                      {selectedThread.department}
                    </span>
                    <span className="text-[10px] text-slate-500">{selectedThread.vendor?.name}</span>
                    <StatusBadge status={selectedThread.status} size="xs" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedThread.assignedTo && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User size={12} />
                      <span>{selectedThread.assignedTo.firstName} {selectedThread.assignedTo.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedThread.messages?.map((msg: any) => {
                  const isRetailer = msg.sender?.role === "RETAILER_LT";
                  return (
                    <div key={msg.id} className={cn("flex", isRetailer ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] rounded-xl p-3",
                        isRetailer ? "bg-[var(--primary)] text-white" : "bg-slate-100",
                        msg.isInternal && "border-2 border-dashed border-amber-300"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium opacity-70">
                            {msg.sender?.firstName} {msg.sender?.lastName}
                          </span>
                          {msg.isInternal && (
                            <span className="text-[9px] bg-amber-200 text-amber-800 px-1 rounded">Internal</span>
                          )}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", isRetailer ? "text-white/50" : "text-slate-400")}>
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compose */}
              <div className="p-4 border-t border-[var(--border)]">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMsg();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={sendMsg}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
