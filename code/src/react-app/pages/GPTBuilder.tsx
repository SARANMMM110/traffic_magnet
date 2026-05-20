import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Upload,
  Image as ImageIcon,
  Globe,
  Code,
  FileText,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Switch } from "@/react-app/components/ui/switch";

interface GPTConfig {
  id?: number;
  name: string;
  description: string;
  avatar_url: string | null;
  category: string;
  model: string;
  instructions: string;
  conversation_starters: string;
  visibility: string;
  deploy_status: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface KnowledgeFile {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  indexing_status: string;
}

interface Capability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
}

export default function GPTBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"create" | "configure">("create");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<GPTConfig>({
    name: "Untitled GPT",
    description: "",
    avatar_url: null,
    category: "general",
    model: "auto",
    instructions: "",
    conversation_starters: "",
    visibility: "private",
    deploy_status: "draft",
  });

  const [createMessages, setCreateMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'll help you build a new GPT. You can say something like, 'make a creative who helps generate visuals for products' or 'make a software engineer who helps format my code'",
    },
    {
      role: "assistant",
      content: "What would you like to make?",
    },
  ]);
  const [createInput, setCreateInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversationId, setConversationId] = useState<number | null>(null);

  const previewMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const createMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll preview panel
  useEffect(() => {
    previewMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [previewMessages]);

  // Auto-scroll create panel
  useEffect(() => {
    createMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [createMessages]);

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([
    {
      id: "web_search",
      name: "Web Search",
      description: "Search the web for information",
      enabled: false,
      icon: Globe,
    },
    {
      id: "image_generation",
      name: "Image Generation",
      description: "Generate images with DALL-E",
      enabled: false,
      icon: ImageIcon,
    },
    {
      id: "code_interpreter",
      name: "Code Interpreter & Data Analysis",
      description: "Run code and analyze data",
      enabled: false,
      icon: Code,
    },
  ]);

  const [starters, setStarters] = useState<string[]>([""]);

  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<string>("draft");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (id && id !== "new") {
      loadGPT();
    }
  }, [id]);

  async function loadGPT() {
    setLoading(true);
    try {
      const response = await fetch(`/api/gpts/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data.gpt);
        
        // Set deployment info
        setDeploymentUrl(data.gpt.public_url || null);
        setDeployStatus(data.gpt.deploy_status || "draft");
        
        // Parse conversation starters
        const startersArray = data.gpt.conversation_starters
          ? data.gpt.conversation_starters.split("\n").filter((s: string) => s.trim())
          : [""];
        if (startersArray.length === 0) startersArray.push("");
        setStarters(startersArray);

        // Load knowledge files
        if (data.gpt.knowledge_files) {
          setKnowledgeFiles(data.gpt.knowledge_files);
        }

        // Update preview
        const welcomeMsg = data.gpt.instructions
          ? "Hello! I'm ready to help you."
          : "Hello! How can I help you today?";
        setPreviewMessages([{ role: "assistant", content: welcomeMsg }]);
      }
    } catch (error) {
      console.error("Failed to load GPT:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const startersText = starters.filter((s) => s.trim()).join("\n");
      const url = config.id ? `/api/gpts/${config.id}` : "/api/gpts";
      const method = config.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...config,
          conversation_starters: startersText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!config.id && data.gpt_id) {
          setConfig((prev) => ({ ...prev, id: data.gpt_id }));
          navigate(`/gpts/${data.gpt_id}/edit`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Failed to save GPT:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMessage() {
    if (!createInput.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: createInput };
    setCreateMessages((prev) => [...prev, userMessage]);
    setCreateInput("");
    setCreateLoading(true);

    try {
      const response = await fetch("/api/gpts/builder-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: createInput,
          current_config: config,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setCreateMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);

        // Update config if AI generated changes
        if (data.updated_config) {
          setConfig((prev) => ({ ...prev, ...data.updated_config }));
          
          // Update starters if provided
          if (data.updated_config.conversation_starters) {
            const startersArray = data.updated_config.conversation_starters
              .split("\n")
              .filter((s: string) => s.trim());
            if (startersArray.length === 0) startersArray.push("");
            setStarters(startersArray);
          }

          // Update preview
          if (data.updated_config.instructions) {
            setPreviewMessages([
              { role: "assistant", content: "Hello! I'm ready to help you." },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setCreateMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handlePreviewMessage() {
    if (!previewInput.trim() || !config.id) return;

    const userMessage: ChatMessage = { role: "user", content: previewInput };
    const currentInput = previewInput;
    setPreviewMessages((prev) => [...prev, userMessage]);
    setPreviewInput("");
    setPreviewLoading(true);

    // Add loading message
    setPreviewMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", loading: true },
    ]);

    try {
      const response = await fetch(`/api/gpts/${config.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: currentInput,
          conversation_history: previewMessages
            .filter((m) => m.role !== "assistant" || !m.loading)
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

      // Add placeholder for assistant message
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", loading: true },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;

        // Update the last message with accumulated content
        setPreviewMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]?.role === "assistant") {
            newMessages[lastIndex] = {
              role: "assistant",
              content: assistantMessage,
              loading: true,
            };
          }
          return newMessages;
        });
      }

      // Mark as complete
      setPreviewMessages((prev) => {
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
    } catch (error) {
      console.error("Failed to send message:", error);
      setPreviewMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setPreviewLoading(false);
    }
  }

  function updateConfig(updates: Partial<GPTConfig>) {
    setConfig((prev) => ({ ...prev, ...updates }));
  }

  function updateStarter(index: number, value: string) {
    setStarters((prev) => {
      const newStarters = [...prev];
      newStarters[index] = value;
      return newStarters;
    });
  }

  function addStarter() {
    setStarters((prev) => [...prev, ""]);
  }

  function removeStarter(index: number) {
    setStarters((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !config.id) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      ".txt",
      ".md",
      ".csv",
      ".json",
    ];
    const isAllowed =
      allowedTypes.includes(file.type) ||
      allowedTypes.some((ext) => file.name.endsWith(ext));

    if (!isAllowed) {
      alert("Please upload TXT, MD, CSV, or JSON files only");
      return;
    }

    // Upload file
    const formData = new FormData();
    formData.append("file", file);

    fetch(`/api/gpts/${config.id}/knowledge/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        return response.json();
      })
      .then((uploadedFile) => {
        // Add to knowledge files list with processing status
        setKnowledgeFiles((prev) => [
          ...prev,
          {
            id: uploadedFile.id,
            filename: uploadedFile.filename,
            file_type: uploadedFile.file_type,
            file_size: uploadedFile.file_size,
            indexing_status: "processing",
          },
        ]);

        // Poll for status
        pollFileStatus(uploadedFile.id);
      })
      .catch((error) => {
        console.error("Upload error:", error);
        alert((error as Error).message);
      });

    // Reset input
    e.target.value = "";
  }

  function pollFileStatus(fileId: number) {
    if (!config.id) return;

    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const checkStatus = () => {
      fetch(`/api/gpts/${config.id}/knowledge/${fileId}/status`, {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((status) => {
          // Update file status
          setKnowledgeFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, indexing_status: status.indexing_status }
                : f
            )
          );

          // Continue polling if still processing
          if (status.indexing_status === "processing" && attempts < maxAttempts) {
            attempts++;
            setTimeout(checkStatus, 1000);
          }
        })
        .catch((error) => {
          console.error("Status check error:", error);
        });
    };

    checkStatus();
  }

  function removeFile(id: number) {
    if (!config.id) return;

    fetch(`/api/gpts/${config.id}/knowledge/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete file");
        }
        setKnowledgeFiles((prev) => prev.filter((f) => f.id !== id));
      })
      .catch((error) => {
        console.error("Delete error:", error);
        alert("Failed to delete file");
      });
  }

  async function handlePublish() {
    if (!config.id) return;
    
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/gpts/${config.id}/publish`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setDeploymentUrl(data.public_url);
        setDeployStatus("published");
      } else {
        alert("Failed to publish GPT");
      }
    } catch (error) {
      console.error("Error publishing GPT:", error);
      alert("Failed to publish GPT");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!config.id) return;
    
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/gpts/${config.id}/unpublish`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setDeployStatus("draft");
      } else {
        alert("Failed to unpublish GPT");
      }
    } catch (error) {
      console.error("Error unpublishing GPT:", error);
      alert("Failed to unpublish GPT");
    } finally {
      setIsPublishing(false);
    }
  }

  function toggleCapability(id: string) {
    setCapabilities((prev) =>
      prev.map((cap) =>
        cap.id === id ? { ...cap, enabled: !cap.enabled } : cap
      )
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* Top Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/gpts")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* GPT Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                {config.name}
              </h1>
              <p className="text-xs text-slate-500">
                {deployStatus === "published" ? "Published" : "Draft"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="ml-8 flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "create"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("configure")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === "configure"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Configure
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deployStatus === "published" && deploymentUrl && (
            <a
              href={deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-violet-600 hover:underline"
            >
              View Live GPT
            </a>
          )}
          
          {config.id && (
            <button
              type="button"
              onClick={deployStatus === "published" ? handleUnpublish : handlePublish}
              disabled={isPublishing}
              className="rounded-lg border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-50 disabled:opacity-50"
            >
              {isPublishing
                ? "Processing..."
                : deployStatus === "published"
                ? "Unpublish"
                : "Publish"}
            </button>
          )}
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex min-h-0 w-full flex-col overflow-hidden lg:w-1/2">
          {activeTab === "create" && (
            <CreateTab
              messages={createMessages}
              input={createInput}
              setInput={setCreateInput}
              onSend={handleCreateMessage}
              loading={createLoading}
              messagesEndRef={createMessagesEndRef}
            />
          )}
          {activeTab === "configure" && (
            <ConfigureTab
              config={config}
              updateConfig={updateConfig}
              starters={starters}
              updateStarter={updateStarter}
              addStarter={addStarter}
              removeStarter={removeStarter}
              capabilities={capabilities}
              toggleCapability={toggleCapability}
              knowledgeFiles={knowledgeFiles}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
            />
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden min-h-0 w-1/2 flex-col border-l border-slate-200 bg-slate-50 lg:flex">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
            <p className="text-xs text-slate-500">Test your GPT</p>
          </div>

          {/* Chat Messages */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
            {previewMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 shadow-sm"
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
            {previewLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={previewMessagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePreviewMessage();
                  }
                }}
                placeholder="Message..."
                disabled={previewLoading}
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handlePreviewMessage}
                disabled={!previewInput.trim() || previewLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTab({
  messages,
  input,
  setInput,
  onSend,
  loading,
  messagesEndRef,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-4">
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={`flex-1 ${
                  msg.role === "user" ? "ml-12 text-slate-700" : "text-slate-900"
                }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Message GPT Builder..."
              className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
              disabled={loading}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!input.trim() || loading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigureTab({
  config,
  updateConfig,
  starters,
  updateStarter,
  addStarter,
  removeStarter,
  capabilities,
  toggleCapability,
  knowledgeFiles,
  handleFileUpload,
  removeFile,
}: {
  config: GPTConfig;
  updateConfig: (updates: Partial<GPTConfig>) => void;
  starters: string[];
  updateStarter: (index: number, value: string) => void;
  addStarter: () => void;
  removeStarter: (index: number) => void;
  capabilities: Capability[];
  toggleCapability: (id: string) => void;
  knowledgeFiles: KnowledgeFile[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: number) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 p-8">
        {/* Profile Picture */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Profile picture
          </label>
          <button
            type="button"
            className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-slate-400 hover:bg-slate-100"
          >
            <Upload className="h-6 w-6" />
          </button>
        </section>

        {/* Name */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="Name your GPT"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </section>

        {/* Model Selection */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Model
          </label>
          <select
            value={config.model || "gpt-4o"}
            onChange={(e) => updateConfig({ model: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          >
            <optgroup label="OpenAI">
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="o1">O1 (Advanced Reasoning)</option>
              <option value="o1-mini">O1 Mini</option>
            </optgroup>
            <optgroup label="Anthropic">
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Best Quality)</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
            </optgroup>
            <optgroup label="Google">
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </optgroup>
            <optgroup label="DeepSeek">
              <option value="deepseek-chat">DeepSeek Chat (Ultra Affordable)</option>
              <option value="deepseek-reasoner">DeepSeek Reasoner</option>
            </optgroup>
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Different models have different capabilities and costs. Configure API keys in Settings.
          </p>
        </section>

        {/* Description */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Description
          </label>
          <textarea
            value={config.description}
            onChange={(e) => updateConfig({ description: e.target.value })}
            placeholder="Add a short description about what this GPT does"
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </section>

        {/* Instructions */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Instructions
          </label>
          <textarea
            value={config.instructions}
            onChange={(e) => updateConfig({ instructions: e.target.value })}
            placeholder="What does this GPT do? How does it behave? What should it avoid doing?"
            rows={8}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
          <p className="mt-2 text-xs text-slate-500">
            Conversations with your GPT can potentially include part or all of the
            instructions provided.
          </p>
        </section>

        {/* Conversation starters */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Conversation starters
          </label>
          <div className="space-y-2">
            {starters.map((starter, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={starter}
                  onChange={(e) => updateStarter(i, e.target.value)}
                  placeholder={`Starter ${i + 1}`}
                  className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
                <button
                  type="button"
                  onClick={() => removeStarter(i)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addStarter}
              className="flex h-11 w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add starter
            </button>
          </div>
        </section>

        {/* Knowledge */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Knowledge
          </label>
          {knowledgeFiles.length === 0 ? (
            <label className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-slate-400 hover:bg-slate-100">
              <div className="text-center">
                <Upload className="mx-auto mb-2 h-6 w-6" />
                <p className="text-sm font-medium">Upload files</p>
                <p className="mt-1 text-xs">PDF, DOCX, TXT, CSV, MD</p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-2">
              {knowledgeFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {file.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        {file.indexing_status}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-slate-400 transition hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100">
                <Plus className="mr-2 h-4 w-4" />
                Upload more files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.csv,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Conversations with your GPT can potentially reveal part or all of the
            files uploaded.
          </p>
        </section>

        {/* Recommended Model */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Recommended model
          </label>
          <select
            value={config.model}
            onChange={(e) => updateConfig({ model: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
          >
            <option value="auto">Auto</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4.1">GPT-4.1</option>
            <option value="claude-sonnet">Claude Sonnet</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </section>

        {/* Capabilities */}
        <section>
          <label className="mb-3 block text-sm font-medium text-slate-900">
            Capabilities
          </label>
          <div className="space-y-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {cap.name}
                      </p>
                      <p className="text-xs text-slate-500">{cap.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={cap.enabled}
                    onCheckedChange={() => toggleCapability(cap.id)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
