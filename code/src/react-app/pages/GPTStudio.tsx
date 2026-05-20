import { useState, useEffect } from "react";
import { Link } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useToast } from "@/react-app/components/Toast";
import {
  Sparkles,
  Plus,
  Brain,
  MessageSquare,
  Rocket,
  Activity,
  Search,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Zap,
  FileText,
  Code2,
  Image as ImageIcon,
  Database,
  Check,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/react-app/components/ui/dropdown-menu";

interface GPT {
  id: number;
  name: string;
  description: string;
  avatar_url: string | null;
  model: string;
  category: string;
  visibility: "private" | "public";
  capabilities: string[];
  conversation_count: number;
  last_updated: string;
  deploy_status: "draft" | "published";
  created_at: string;
}

export default function GPTStudio() {
  const [gpts, setGpts] = useState<GPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadGPTs();
  }, []);

  async function loadGPTs() {
    try {
      const response = await fetch("/api/gpts", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGpts(data.gpts || []);
      }
    } catch (error) {
      console.error("Failed to load GPTs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGPTs = gpts.filter((gpt) =>
    gpt.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalConversations = gpts.reduce((sum, gpt) => sum + (gpt.conversation_count || 0), 0);
  const publishedCount = gpts.filter((g) => g.deploy_status === "published").length;
  const activeCapabilities = new Set(gpts.flatMap((g) => g.capabilities || [])).size;

  const capabilityIcons: Record<string, any> = {
    "web_search": Globe,
    "image_generation": ImageIcon,
    "file_analysis": FileText,
    "code_interpreter": Code2,
    "memory": Database,
    "canvas": Zap,
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 md:px-8 md:py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-400 ring-1 ring-violet-500/20">
                <Brain className="h-4 w-4" />
                AI Operating Platform
              </div>
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Build intelligent AI systems
              </h1>
              <p className="max-w-2xl text-lg text-slate-400 md:text-xl">
                Create, configure, and deploy custom GPTs with advanced capabilities,
                knowledge bases, and actions. Your AI operating system.
              </p>
            </div>

            <Link to="/gpts/new">
              <button
                type="button"
                className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 text-base font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-400 opacity-0 transition-opacity group-hover:opacity-20" />
                <Plus className="h-5 w-5" />
                Create GPT
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Brain}
              label="GPTs Built"
              value={gpts.length}
              gradient="from-violet-500/20 to-purple-500/20"
              iconColor="text-violet-400"
            />
            <StatCard
              icon={MessageSquare}
              label="Conversations"
              value={totalConversations}
              gradient="from-blue-500/20 to-cyan-500/20"
              iconColor="text-blue-400"
            />
            <StatCard
              icon={Rocket}
              label="Deployed"
              value={publishedCount}
              gradient="from-emerald-500/20 to-teal-500/20"
              iconColor="text-emerald-400"
            />
            <StatCard
              icon={Zap}
              label="Capabilities"
              value={activeCapabilities}
              gradient="from-orange-500/20 to-amber-500/20"
              iconColor="text-orange-400"
            />
          </div>
        </section>

        {/* Search & Filter */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search GPTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-800 bg-slate-900/50 pl-12 pr-4 text-sm text-white placeholder-slate-500 backdrop-blur-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* GPT Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : filteredGPTs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/30 py-20 backdrop-blur-sm">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Brain className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              {searchQuery ? "No GPTs found" : "Build your first GPT"}
            </h3>
            <p className="mb-6 max-w-md text-center text-sm text-slate-400">
              {searchQuery
                ? "Try a different search term"
                : "Create intelligent AI systems tailored to your specific needs"}
            </p>
            {!searchQuery && (
              <Link to="/gpts/new">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First GPT
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGPTs.map((gpt) => (
              <GPTCard
                key={gpt.id}
                gpt={gpt}
                capabilityIcons={capabilityIcons}
                onUpdate={loadGPTs}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  iconColor,
}: {
  icon: any;
  label: string;
  value: number;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition hover:border-slate-700">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100", gradient)} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <Icon className={cn("h-5 w-5", iconColor)} />
          <Activity className="h-4 w-4 text-slate-600" />
        </div>
        <div className="mb-1 text-3xl font-bold text-white">{value.toLocaleString()}</div>
        <div className="text-sm text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function GPTCard({
  gpt,
  capabilityIcons,
  onUpdate,
}: {
  gpt: GPT;
  capabilityIcons: Record<string, any>;
  onUpdate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function handleCopyEmbedCode() {
    try {
      const response = await fetch(`/api/gpts/${gpt.id}/embed/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "popup",
          theme: {
            primaryColor: "#7C5CFC",
            backgroundColor: "#0f172a",
            textColor: "#ffffff",
          },
          greeting: "Hi! How can I help you today?",
          buttonText: gpt.name,
          position: "bottom-right",
          targetElement: "mocha-gpt-widget",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.embed_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast({
          type: "success",
          title: "Embed code copied!",
          message: "Paste it into your website's HTML",
        });
      } else {
        const error = await response.json();
        showToast({
          type: "error",
          title: "Failed to copy embed code",
          message: error.error === "GPT must be published first" 
            ? "Please publish your GPT before generating embed code"
            : error.error || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Failed to copy embed code:", error);
      showToast({
        type: "error",
        title: "Failed to copy embed code",
        message: "An unexpected error occurred",
      });
    }
    setShowMenu(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${gpt.name}"?`)) return;
    try {
      const response = await fetch(`/api/gpts/${gpt.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to delete GPT:", error);
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm transition hover:border-slate-700 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
      {/* Status Badge */}
      <div className="absolute right-4 top-4 z-10">
        {gpt.deploy_status === "published" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <Globe className="h-3 w-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-600/50">
            <Lock className="h-3 w-3" />
            Draft
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Avatar & Title */}
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30">
            {gpt.avatar_url ? (
              <img src={gpt.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Brain className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate text-lg font-bold text-white">{gpt.name}</h3>
            <span className="inline-flex rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
              {gpt.category || 'General'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {gpt.description || 'No description'}
        </p>

        {/* Meta */}
        <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {gpt.conversation_count || 0} chats
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {gpt.model || 'gpt-4o'}
          </span>
        </div>

        {/* Capabilities */}
        {gpt.capabilities && gpt.capabilities.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {gpt.capabilities.slice(0, 4).map((cap) => {
              const Icon = capabilityIcons[cap] || Zap;
              return (
                <div
                  key={cap}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400"
                >
                  <Icon className="h-3 w-3" />
                  {cap.replace(/_/g, " ")}
                </div>
              );
            })}
            {gpt.capabilities.length > 4 && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400">
                +{gpt.capabilities.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link to={`/gpts/${gpt.id}/chat`} className="flex-1">
            <button
              type="button"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Use
            </button>
          </Link>
          <Link to={`/gpts/${gpt.id}/edit`}>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
          </Link>
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-white transition hover:bg-slate-800"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-slate-700 bg-slate-800">
              <DropdownMenuItem 
                onClick={handleCopyEmbedCode}
                className="text-slate-300 focus:bg-slate-700 focus:text-white"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Code2 className="mr-2 h-4 w-4" />
                    Copy Embed Code
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-white">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-400 focus:bg-red-950 focus:text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
