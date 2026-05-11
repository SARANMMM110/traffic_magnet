import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Loader2, FileCode, Download, Eye, Sparkles, FileText } from "lucide-react";

interface SEOContent {
  intro_text: string;
  h2_sections: string;
  faqs: string;
  meta_title: string;
  meta_description: string;
  cta_text: string;
}

interface Tool {
  id: number;
  name: string;
  description: string;
  traffic_score: number;
  backlink_score: number;
  monetization_score: number;
  overall_score: number;
  reasoning: string;
  blueprint: string | null;
  html_content: string | null;
  seo_content: SEOContent | null;
}

export default function ToolBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
  const [generatingHTML, setGeneratingHTML] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWrappedPreview, setShowWrappedPreview] = useState(false);

  useEffect(() => {
    loadTool();
  }, [id]);

  const loadTool = async () => {
    try {
      const response = await fetch(`/api/tools/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool(data);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to load tool:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateBlueprint = async () => {
    setGeneratingBlueprint(true);
    try {
      const response = await fetch(`/api/tools/${id}/blueprint`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool((prev) => prev ? { ...prev, blueprint: data.blueprint } : null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate blueprint");
      }
    } catch (error) {
      console.error("Failed to generate blueprint:", error);
      alert("An error occurred");
    } finally {
      setGeneratingBlueprint(false);
    }
  };

  const generateHTML = async () => {
    setGeneratingHTML(true);
    try {
      const response = await fetch(`/api/tools/${id}/html`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool((prev) => prev ? { ...prev, html_content: data.html } : null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate HTML");
      }
    } catch (error) {
      console.error("Failed to generate HTML:", error);
      alert("An error occurred");
    } finally {
      setGeneratingHTML(false);
    }
  };

  const generateSEO = async () => {
    setGeneratingSEO(true);
    try {
      const response = await fetch(`/api/tools/${id}/seo`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTool((prev) => 
          prev ? { 
            ...prev, 
            seo_content: {
              intro_text: data.intro_text,
              h2_sections: JSON.stringify(data.h2_sections),
              faqs: JSON.stringify(data.faqs),
              meta_title: data.meta_title,
              meta_description: data.meta_description,
              cta_text: data.cta_text,
            }
          } : null
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to generate SEO content");
      }
    } catch (error) {
      console.error("Failed to generate SEO content:", error);
      alert("An error occurred");
    } finally {
      setGeneratingSEO(false);
    }
  };

  const downloadHTML = () => {
    if (!tool?.html_content) return;

    const blob = new Blob([tool.html_content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadWrappedHTML = () => {
    if (!tool?.html_content || !tool?.seo_content) return;

    const h2Sections = JSON.parse(tool.seo_content.h2_sections);
    const faqs = JSON.parse(tool.seo_content.faqs);

    const wrappedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.seo_content.meta_title}</title>
    <meta name="description" content="${tool.seo_content.meta_description}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .seo-content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a1a2e;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        h2 {
            color: #7c3aed;
            font-size: 1.8em;
            margin-top: 40px;
            margin-bottom: 15px;
        }
        h3 {
            color: #1a1a2e;
            font-size: 1.3em;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
            font-size: 1.05em;
        }
        .tool-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
            border: 2px solid #7c3aed;
        }
        .faq-item {
            margin-bottom: 25px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .faq-question {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        .faq-answer {
            color: #555;
        }
        .cta {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin: 40px 0;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="seo-content">
        <h1>${tool.name}</h1>
        <p>${tool.seo_content.intro_text}</p>
    </div>

    <div class="tool-container">
        ${tool.html_content}
    </div>

    <div class="seo-content">
        ${h2Sections.map((section: { heading: string; content: string }) => `
            <h2>${section.heading}</h2>
            <p>${section.content}</p>
        `).join('')}

        <h2>Frequently Asked Questions</h2>
        ${faqs.map((faq: { question: string; answer: string }) => `
            <div class="faq-item">
                <div class="faq-question">${faq.question}</div>
                <div class="faq-answer">${faq.answer}</div>
            </div>
        `).join('')}

        <div class="cta">
            ${tool.seo_content.cta_text}
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([wrappedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}-seo.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tool) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p>Tool not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">{tool.name}</h1>
          <p className="text-[#6B7280] mb-4">{tool.description}</p>
          
          <div className="flex gap-3">
            <div className="px-3 py-1 bg-blue-50 rounded-full text-sm">
              Traffic: {tool.traffic_score}/100
            </div>
            <div className="px-3 py-1 bg-green-50 rounded-full text-sm">
              Backlinks: {tool.backlink_score}/100
            </div>
            <div className="px-3 py-1 bg-purple-50 rounded-full text-sm">
              Monetization: {tool.monetization_score}/100
            </div>
          </div>
        </div>

        {/* Step 1: Blueprint */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#7C3AED]" />
              Step 1: Generate Blueprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!tool.blueprint ? (
              <div className="space-y-4">
                <p className="text-sm text-[#6B7280]">
                  The blueprint is a detailed plan that describes how your tool will work,
                  what features it will have, and how users will interact with it.
                </p>
                <Button
                  onClick={generateBlueprint}
                  disabled={generatingBlueprint}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                >
                  {generatingBlueprint ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Blueprint...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Blueprint
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    ✓
                  </div>
                  <span className="font-medium">Blueprint Generated</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {tool.blueprint}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Generate HTML */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#7C3AED]" />
              Step 2: Generate Working Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!tool.html_content ? (
              <div className="space-y-4">
                <p className="text-sm text-[#6B7280]">
                  Generate a complete, self-contained HTML file with all the CSS and
                  JavaScript needed to make your tool work.
                </p>
                <Button
                  onClick={generateHTML}
                  disabled={!tool.blueprint || generatingHTML}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                >
                  {generatingHTML ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating HTML...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate HTML
                    </>
                  )}
                </Button>
                {!tool.blueprint && (
                  <p className="text-sm text-red-600">
                    Generate blueprint first before creating the HTML
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    ✓
                  </div>
                  <span className="font-medium">HTML Generated</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                  <Button
                    onClick={downloadHTML}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download HTML
                  </Button>
                </div>

                {showPreview && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={tool.html_content}
                      className="w-full h-[600px] bg-white"
                      title="Tool Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: SEO Content Wrapper */}
        {tool.html_content && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7C3AED]" />
                Step 3: Add SEO Content Wrapper
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tool.seo_content ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#6B7280]">
                    Wrap your tool with SEO-optimized content including an introduction,
                    content sections, FAQs, and meta tags to help it rank in search engines.
                  </p>
                  <Button
                    onClick={generateSEO}
                    disabled={generatingSEO}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                  >
                    {generatingSEO ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating SEO Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate SEO Content
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      ✓
                    </div>
                    <span className="font-medium">SEO Content Generated</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-[#1A1A2E] mb-1">Meta Title:</h4>
                      <p className="text-sm text-[#6B7280]">{tool.seo_content.meta_title}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-[#1A1A2E] mb-1">Meta Description:</h4>
                      <p className="text-sm text-[#6B7280]">{tool.seo_content.meta_description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-[#1A1A2E] mb-1">Introduction:</h4>
                      <p className="text-sm text-[#6B7280]">{tool.seo_content.intro_text}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-[#1A1A2E] mb-1">Content Sections:</h4>
                      <p className="text-sm text-[#6B7280]">
                        {JSON.parse(tool.seo_content.h2_sections).length} sections with headings
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-[#1A1A2E] mb-1">FAQs:</h4>
                      <p className="text-sm text-[#6B7280]">
                        {JSON.parse(tool.seo_content.faqs).length} questions and answers
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowWrappedPreview(!showWrappedPreview)}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showWrappedPreview ? "Hide Preview" : "Preview with SEO"}
                    </Button>
                    <Button
                      onClick={downloadWrappedHTML}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download SEO Version
                    </Button>
                    <Button
                      onClick={generateSEO}
                      disabled={generatingSEO}
                      variant="outline"
                    >
                      {generatingSEO ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>

                  {showWrappedPreview && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={(() => {
                          const h2Sections = JSON.parse(tool.seo_content.h2_sections);
                          const faqs = JSON.parse(tool.seo_content.faqs);
                          return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.seo_content.meta_title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .seo-content { background: white; padding: 40px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1a1a2e; font-size: 2.5em; margin-bottom: 20px; }
        h2 { color: #7c3aed; font-size: 1.8em; margin-top: 40px; margin-bottom: 15px; }
        p { margin-bottom: 15px; font-size: 1.05em; }
        .tool-container { background: white; padding: 40px; border-radius: 8px; margin: 30px 0; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1); border: 2px solid #7c3aed; }
        .faq-item { margin-bottom: 25px; padding: 20px; background: #f9fafb; border-radius: 6px; }
        .faq-question { font-weight: 600; color: #1a1a2e; font-size: 1.1em; margin-bottom: 10px; }
        .cta { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 40px 0; font-size: 1.1em; }
    </style>
</head>
<body>
    <div class="seo-content">
        <h1>${tool.name}</h1>
        <p>${tool.seo_content.intro_text}</p>
    </div>
    <div class="tool-container">${tool.html_content}</div>
    <div class="seo-content">
        ${h2Sections.map((s: any) => `<h2>${s.heading}</h2><p>${s.content}</p>`).join('')}
        <h2>Frequently Asked Questions</h2>
        ${faqs.map((f: any) => `<div class="faq-item"><div class="faq-question">${f.question}</div><div>${f.answer}</div></div>`).join('')}
        <div class="cta">${tool.seo_content.cta_text}</div>
    </div>
</body>
</html>`;
                        })()}
                        className="w-full h-[600px] bg-white"
                        title="SEO Wrapped Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
