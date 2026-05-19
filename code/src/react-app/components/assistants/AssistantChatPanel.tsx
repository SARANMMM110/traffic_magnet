import { useCallback, useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { AIStreamingText } from "@/react-app/components/AIStreamingText";
import { captureConversationLead, streamAssistantChat, type AssistantRecord } from "@/react-app/lib/assistantApi";
import { cn } from "@/react-app/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string; streaming?: boolean };

type Props = {
  assistant: AssistantRecord;
  onClose?: () => void;
  className?: string;
  pageContext?: Record<string, unknown>;
};

export default function AssistantChatPanel({ assistant, onClose, className, pageContext }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setStreaming(true);

    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", streaming: true }]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let acc = "";
    await streamAssistantChat(assistant.id, text, {
      conversationId,
      pageContext: {
        ...pageContext,
        niche: assistant.niche,
        monetizationGoal: assistant.monetizationGoal,
        toolName: assistant.name,
      },
      signal: abortRef.current.signal,
      onToken: (token) => {
        acc += token;
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: acc };
          return copy;
        });
      },
      onDone: (d) => {
        if (d.conversationId) setConversationId(d.conversationId);
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, streaming: false };
          return copy;
        });
        const settings = assistant.engagementSettings || {};
        if (settings.leadCaptureEnabled) setShowLeadForm(true);
      },
      onError: (msg) => {
        setMessages((m) => [
          ...m.slice(0, -1),
          { role: "assistant", content: msg || "Something went wrong. Try again." },
        ]);
      },
    });

    setLoading(false);
    setStreaming(false);
  }, [assistant, conversationId, input, loading, pageContext]);

  const submitLead = async () => {
    if (!conversationId || !leadEmail.trim()) return;
    await captureConversationLead(conversationId, {
      email: leadEmail.trim(),
      assistantId: assistant.id,
      captureFlowPublicId: assistant.captureFlowPublicId || undefined,
      assetKey: assistant.assetKey,
    });
    setShowLeadForm(false);
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "Thanks — we'll send your personalized resource shortly." },
    ]);
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{assistant.name}</p>
            <p className="text-xs text-slate-500">Live AI · {assistant.status}</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            Start a conversation — responses stream in real time.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-violet-600 text-white"
                : "mr-auto bg-slate-100 text-slate-800",
            )}
          >
            {msg.streaming ? (
              <AIStreamingText text={msg.content} isStreaming={streaming} />
            ) : (
              msg.content
            )}
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {showLeadForm && (
        <div className="px-4 py-2 border-t border-violet-100 bg-violet-50/50">
          <p className="text-xs text-slate-600 mb-2">Get a personalized follow-up via email</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={submitLead} className="bg-violet-600 hover:bg-violet-700">
              Send
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-violet-600 hover:bg-violet-700 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
