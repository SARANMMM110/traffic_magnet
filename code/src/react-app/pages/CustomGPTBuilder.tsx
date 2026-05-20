import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/react-app/components/ui/select";
import { ExternalLink, Copy, Check, Loader2, Sparkles, Rocket, Info } from "lucide-react";

interface Blueprint {
  id: number;
  name: string;
  category: string;
  blueprint: string;
}

export default function CustomGPTBuilder() {
  const location = useLocation();
  
  // Blueprints
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [isLoadingBlueprints, setIsLoadingBlueprints] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInstructions, setGeneratedInstructions] = useState("");
  const [generatedName, setGeneratedName] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<{ web_browsing: boolean; dalle_image_generation: boolean; code_interpreter: boolean }>({ web_browsing: false, dalle_image_generation: false, code_interpreter: false });
  const [copied, setCopied] = useState(false);

  // Reset to main page when route is accessed
  useEffect(() => {
    setGeneratedInstructions("");
    setGeneratedName("");
    setGeneratedDescription("");
    setConversationStarters([]);
    setCapabilities({ web_browsing: false, dalle_image_generation: false, code_interpreter: false });
    setSelectedBlueprintId("");
    setCopied(false);
  }, [location.pathname]);

  // Load blueprints on mount
  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    setIsLoadingBlueprints(true);
    try {
      const response = await fetch("/api/tools/with-blueprints", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBlueprints(data.tools || []);
      }
    } catch (error) {
      console.error("Failed to load blueprints:", error);
      toast.error("Failed to load blueprints");
    } finally {
      setIsLoadingBlueprints(false);
    }
  };

  const handleGenerateInstructions = async () => {
    if (!selectedBlueprintId) {
      toast.error("Please select a blueprint");
      return;
    }

    const selectedBlueprint = blueprints.find((b) => b.id.toString() === selectedBlueprintId);
    if (!selectedBlueprint) {
      toast.error("Blueprint not found");
      return;
    }

    setIsGenerating(true);
    try {
      // Parse the blueprint to extract information
      let blueprintData: any = {};
      try {
        // Try to parse as JSON first
        blueprintData = JSON.parse(selectedBlueprint.blueprint);
      } catch {
        // If not JSON, it's the old text format - extract manually
        blueprintData = {
          title: selectedBlueprint.name,
          purpose: selectedBlueprint.blueprint.match(/Purpose: ([^\n]+)/)?.[1] || "",
          target_keywords: selectedBlueprint.blueprint.match(/Target Keywords: ([^\n]+)/)?.[1]?.split(", ") || [],
          description: selectedBlueprint.blueprint.match(/Description: ([^\n]+)/)?.[1] || "",
        };
      }

      // Build core functions from blueprint
      const coreFunctions = blueprintData.purpose || blueprintData.description || `Help users with ${selectedBlueprint.name}`;
      const persona = "expert";
      const tone = "professional";

      const response = await fetch("/api/customgpt/generate-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coreFunctions,
          persona,
          tone,
          painPoints: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedInstructions(data.instructions);
        setGeneratedName(data.name || selectedBlueprint.name);
        setGeneratedDescription(data.description || "");
        setConversationStarters(data.conversation_starters || []);
        setCapabilities(data.capabilities || { web_browsing: false, dalle_image_generation: false, code_interpreter: false });
        toast.success("GPT configuration generated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Generation error:", errorData);
        toast.error(`Failed to generate instructions: ${errorData.error || errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error generating instructions:", error);
      toast.error(`Failed to generate instructions: ${error instanceof Error ? error.message : "Network error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyInstructions = () => {
    const fullConfig = `NAME:
${generatedName}

DESCRIPTION:
${generatedDescription}

INSTRUCTIONS:
${generatedInstructions}

CONVERSATION STARTERS:
${conversationStarters.map((s, i) => `${i + 1}. ${s}`).join('\n')}

CAPABILITIES:
- Web Browsing: ${capabilities.web_browsing ? 'ENABLED' : 'DISABLED'}
- DALL-E Image Generation: ${capabilities.dalle_image_generation ? 'ENABLED' : 'DISABLED'}
- Code Interpreter: ${capabilities.code_interpreter ? 'ENABLED' : 'DISABLED'}`;
    
    navigator.clipboard.writeText(fullConfig);
    setCopied(true);
    toast.success("Complete GPT configuration copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChatGPT = () => {
    window.open("https://chatgpt.com/gpts/editor", "_blank");
  };

  if (generatedInstructions) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Name Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Name</h3>
                <h1 className="text-3xl font-bold text-slate-900">{generatedName}</h1>
              </div>

              {/* Description Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-700 leading-relaxed">{generatedDescription}</p>
              </div>

              {/* Instructions Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Instructions</h3>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                    {generatedInstructions}
                  </pre>
                </div>
              </div>

              {/* Conversation Starters Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Conversation Starters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conversationStarters.map((starter, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700">
                      {starter}
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Capabilities</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${capabilities.web_browsing ? 'bg-green-500 border-green-500' : 'bg-slate-200 border-slate-300'}`}>
                      {capabilities.web_browsing && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-slate-700">Web Browsing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${capabilities.dalle_image_generation ? 'bg-green-500 border-green-500' : 'bg-slate-200 border-slate-300'}`}>
                      {capabilities.dalle_image_generation && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-slate-700">DALL-E Image Generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${capabilities.code_interpreter ? 'bg-green-500 border-green-500' : 'bg-slate-200 border-slate-300'}`}>
                      {capabilities.code_interpreter && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-slate-700">Code Interpreter</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleCopyInstructions}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8 font-bold border-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  onClick={handleOpenChatGPT}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 shadow-lg font-bold border-0"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open GPT Builder
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 mb-8"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/30">
              <Sparkles className="w-4 h-4" />
              AI-Powered CustomGPT Builder
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-900 via-purple-900 to-blue-900 bg-clip-text text-transparent leading-[1.1] tracking-tight">
              Build Powerful CustomGPTs
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Research real-world problems, generate expert-level instructions, and deploy custom AI assistants on ChatGPT in minutes
            </p>
          </motion.div>

          {/* Create Your GPTs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-90"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              
              {/* Content */}
              <div className="relative">
                {/* Header */}
                <div className="p-8 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white mb-2">Create Your GPTs</h2>
                      <p className="text-blue-50 text-base leading-relaxed">
                        Select a blueprint from your generated assets and create CustomGPT instructions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="px-8 pb-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/60">
                    <div className="max-w-4xl mx-auto">
                      {/* Blueprint Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Select Blueprint
                        </label>
                        
                        {isLoadingBlueprints ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                          </div>
                        ) : blueprints.length === 0 ? (
                          <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
                            <p className="text-sm text-slate-600 mb-2">No blueprints available</p>
                            <p className="text-xs text-slate-500">Create a project and generate blueprints first</p>
                          </div>
                        ) : (
                          <>
                            {/* Horizontal Layout: Dropdown + Button */}
                            <div className="flex items-center gap-3">
                              <div className="flex-[2]">
                                <Select value={selectedBlueprintId} onValueChange={setSelectedBlueprintId}>
                                  <SelectTrigger className="h-14 bg-white border-2 border-slate-200 hover:border-indigo-400 focus:border-indigo-500 text-base font-medium rounded-xl">
                                    <SelectValue placeholder="Choose a blueprint..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {blueprints.map((blueprint) => (
                                      <SelectItem key={blueprint.id} value={blueprint.id.toString()}>
                                        {blueprint.name} - {blueprint.category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button
                                onClick={handleGenerateInstructions}
                                disabled={isGenerating || !selectedBlueprintId}
                                className="h-14 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                size="lg"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="h-5 w-5 mr-2" />
                                    <span>Generate Instructions</span>
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {/* Info Text */}
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <p>Generate a complete CustomGPT instruction framework from the selected blueprint.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
