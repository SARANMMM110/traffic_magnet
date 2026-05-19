import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { useToast } from "@/react-app/components/Toast";
import AssistantBuilder from "@/react-app/components/assistants/AssistantBuilder";
import AssistantChatPanel from "@/react-app/components/assistants/AssistantChatPanel";
import {
  activateAssistant,
  deleteAssistant,
  duplicateAssistant,
  fetchStudioOverview,
  pauseAssistant,
  type AssistantRecord,
  type StudioOverview,
} from "@/react-app/lib/assistantApi";
import { cn } from "@/react-app/lib/utils";

export default function AIAssistantStudio() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState<AssistantRecord[]>([]);
  const [overview, setOverview] = useState<StudioOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ event_type: string; created_at: string; assistant_name: string }>
  >([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewAssistant, setPreviewAssistant] = useState<AssistantRecord | null>(null);
  const [tools, setTools] = useState<Array<{ id: number; name: string }>>([]);
  const [captureFlows, setCaptureFlows] = useState<Array<{ publicId: string; name: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [studio, toolsRes, flowsRes] = await Promise.all([
        fetchStudioOverview(),
        fetch("/api/tools", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/audience/flows", { credentials: "include" }).then((r) => r.json()),
      ]);
      setAssistants(studio.assistants);
      setOverview(studio.overview);
      setRecentActivity(studio.recentActivity || []);
      const toolList = (toolsRes.tools || []).map((t: { id: number; name: string }) => ({
        id: t.id,
        name: t.name,
      }));
      setTools(toolList);
      setCaptureFlows(
        (flowsRes.flows || []).map((f: { publicId: string; name: string }) => ({
          publicId: f.publicId,
          name: f.name,
        })),
      );
    } catch (e) {
      showToast({ title: e instanceof Error ? e.message : "Failed to load studio", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePause = async (a: AssistantRecord) => {
    await pauseAssistant(a.id);
    showToast({ title: "Assistant paused", type: "success" });
    load();
  };

  const handleActivate = async (a: AssistantRecord) => {
    await activateAssistant(a.id);
    showToast({ title: "Assistant activated", type: "success" });
    load();
  };

  const handleDuplicate = async (a: AssistantRecord) => {
    await duplicateAssistant(a.id);
    showToast({ title: "Assistant duplicated", type: "success" });
    load();
  };

  const handleDelete = async (a: AssistantRecord) => {
    if (!confirm(`Delete "${a.name}"?`)) return;
    await deleteAssistant(a.id);
    showToast({ title: "Deleted", type: "success" });
    load();
  };

  const copySnippet = (publicId: string, assetKey: string) => {
    const origin = window.location.origin;
    const snippet = `\n<script src="${origin}/api/assistant/widget.js" async data-assistant="${publicId}" data-asset="${assetKey}"></script>\n`;
    navigator.clipboard.writeText(snippet);
    showToast({ title: "Embed snippet copied", type: "success" });
  };

  if (loading && !overview) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  const ov = overview || {
    totalAssistants: 0,
    activeAssistants: 0,
    totalConversations: 0,
    totalMessages: 0,
    leadInfluence: 0,
    avgConversionRate: 0,
    engagementRate: 0,
  };

  const safeNumber = (val: number | null | undefined, defaultVal = 0): number => {
    return typeof val === 'number' && !isNaN(val) ? val : defaultVal;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  AI Assistant Studio
                </h1>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed">
                Deploy intelligent AI assistants across your traffic assets — real conversations, lead capture, and
                conversion tracking.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                onClick={() => setBuilderOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assistant
              </Button>
              {previewAssistant && (
                <Button variant="outline" onClick={() => setPreviewAssistant(null)}>
                  Close preview
                </Button>
              )}
            </div>
          </div>

          {previewAssistant ? (
            <AssistantChatPanel
              assistant={previewAssistant}
              onClose={() => setPreviewAssistant(null)}
              className="h-[520px]"
              pageContext={{ currentPage: "studio-preview" }}
            />
          ) : (
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">Live activity</span>
                </div>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-slate-500">No events yet — deploy an assistant to start.</p>
                )}
                {recentActivity.map((ev, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                    <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{ev.event_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">
                        {ev.assistant_name} · {new Date(ev.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
                <div>
                  <div className="text-lg font-bold">{safeNumber(ov.engagementRate).toFixed(0)}%</div>
                  <div className="text-xs text-slate-500">Engagement</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{safeNumber(ov.avgConversionRate).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">Conversion</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{ov.leadInfluence}</div>
                  <div className="text-xs text-slate-500">Leads</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { 
              label: "Active Assistants", 
              value: safeNumber(ov.activeAssistants), 
              icon: CheckCircle2, 
              gradient: "from-emerald-500 to-green-600",
              bg: "from-emerald-50 to-green-50"
            },
            { 
              label: "Conversations", 
              value: safeNumber(ov.totalConversations), 
              icon: Users, 
              gradient: "from-violet-500 to-purple-600",
              bg: "from-violet-50 to-purple-50"
            },
            { 
              label: "Lead Influence", 
              value: safeNumber(ov.leadInfluence), 
              icon: Target, 
              gradient: "from-blue-500 to-cyan-600",
              bg: "from-blue-50 to-cyan-50"
            },
            {
              label: "Conversion Rate",
              value: `${safeNumber(ov.avgConversionRate).toFixed(1)}%`,
              icon: Zap,
              gradient: "from-orange-500 to-amber-600",
              bg: "from-orange-50 to-amber-50"
            },
          ].map((m) => (
            <div key={m.label} className={cn("bg-gradient-to-br rounded-2xl border border-slate-200/50 p-6 shadow-lg hover:shadow-xl transition-all", m.bg)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-700">{m.label}</span>
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", m.gradient)}>
                  <m.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Your assistants</h2>
            <div className="text-sm text-slate-600">
              {assistants.length} {assistants.length === 1 ? 'assistant' : 'assistants'} deployed
            </div>
          </div>
          <div className="space-y-4">
            {assistants.length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-600 mb-4">No assistants yet. Create one to engage visitors with live AI.</p>
                <Button onClick={() => setBuilderOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assistant
                </Button>
              </div>
            )}
            {assistants.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{a.name}</h3>
                      <p className="text-sm text-slate-600">
                        {a.assetType || "embed"} · {a.niche || "General"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                        <Badge variant="outline">{a.assistantType}</Badge>
                      </div>
                    </div>
                  </div>
                  {a.status === "active" ? (
                    <Button variant="outline" size="sm" onClick={() => handlePause(a)}>
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleActivate(a)}>
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{safeNumber(a.engagementScore).toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Engagement</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{a.totalConversations}</div>
                    <div className="text-xs text-slate-500">Chats</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{safeNumber(a.conversionRate).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500">Conversion</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{a.leadInfluenceCount}</div>
                    <div className="text-xs text-slate-500">Leads</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setPreviewAssistant(a)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Preview chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copySnippet(a.publicId, a.assetKey)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Embed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(a)}>
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(a)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AssistantBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onCreated={() => {
          setBuilderOpen(false);
          load();
        }}
        tools={tools}
        captureFlows={captureFlows}
      />
    </DashboardLayout>
  );
}
