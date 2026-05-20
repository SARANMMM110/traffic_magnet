import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface GPT {
  id: number;
  name: string;
  description: string;
  avatar_url: string | null;
  instructions: string;
  welcome_message: string;
}

export default function GPTChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gpt, setGPT] = useState<GPT | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadGPT();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadGPT() {
    setLoading(true);
    try {
      const response = await fetch(`/api/gpts/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setGPT(data.gpt);
        
        const welcomeMsg = data.gpt.welcome_message || "Hello! How can I help you today?";
        setMessages([{ role: "assistant", content: welcomeMsg }]);
      } else {
        navigate("/gpts");
      }
    } catch (error) {
      console.error("Failed to load GPT:", error);
      navigate("/gpts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !gpt) return;

    const userMessage: Message = { role: "user", content: input };
    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Add loading message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", loading: true },
    ]);

    try {
      const response = await fetch(`/api/gpts/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: currentInput,
          conversation_history: messages
            .filter((m) => !m.loading)
            .map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      // Extract session and conversation IDs from response headers
      const newSessionId = response.headers.get("X-Session-Id");
      const newConvId = response.headers.get("X-Conversation-Id");
      
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }
      if (newConvId && !conversationId) {
        setConversationId(parseInt(newConvId));
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let assistantMessage = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        // Update the last message with accumulated content
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]?.role === "assistant") {
            newMessages[lastIndex] = {
              role: "assistant",
              content: assistantMessage,
            };
          }
          return newMessages;
        });
      }

      // Remove loading state
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex]) {
          delete newMessages[lastIndex].loading;
        }
        return newMessages;
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.slice(0, -1).concat([
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ])
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!gpt) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/gpts")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              {gpt.avatar_url ? (
                <img
                  src={gpt.avatar_url}
                  alt={gpt.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {gpt.name?.charAt(0).toUpperCase() || "G"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                {gpt.name}
              </h1>
              {gpt.description && (
                <p className="text-xs text-slate-500">{gpt.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
