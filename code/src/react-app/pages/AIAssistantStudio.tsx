import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Button } from "@/react-app/components/ui/button";
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
  Users,
  Target,
  Zap,
  Plus,
  Settings,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function AIAssistantStudio() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Title & CTAs */}
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
                Deploy intelligent AI assistants across your traffic assets to engage visitors, answer questions, 
                recommend offers, and increase conversions automatically.
              </p>
            </div>

            <div className="flex gap-3">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Assistant
              </Button>
              <Button variant="outline" className="border-slate-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Conversations
              </Button>
            </div>

            <p className="text-sm text-slate-500">
              Context-aware AI assistants built specifically for your tools, landing pages, SEO assets, and monetization workflows.
            </p>
          </div>

          {/* Right: Live Preview Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-700">Live Activity</span>
              </div>
              <span className="text-xs text-slate-500">Real-time</span>
            </div>

            {/* Live Feed Items */}
            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-violet-50 border border-violet-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Finance Calculator Assistant</p>
                  <p className="text-xs text-slate-600">Engaged visitor → Recommended premium tool</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Lead captured</p>
                  <p className="text-xs text-slate-600">Visitor qualified through AI conversation</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Intent signal detected</p>
                  <p className="text-xs text-slate-600">"How much does this cost?" → Pricing CTA shown</p>
                </div>
              </div>
            </div>

            {/* Mini Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">38%</div>
                <div className="text-xs text-slate-500">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">22%</div>
                <div className="text-xs text-slate-500">Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900">156</div>
                <div className="text-xs text-slate-500">Leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Assistants</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +3 this week
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Engagement Rate</span>
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">42.3%</div>
            <div className="text-xs text-violet-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.2% vs last month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Lead Influence</span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">8.7</div>
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Premium quality
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Conversion Rate</span>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">18.4%</div>
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% improvement
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Assistants List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">AI Assistants</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-200">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Assistant Cards */}
            <div className="space-y-4">
              {/* Assistant Card 1 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Finance Calculator Assistant</h3>
                      <p className="text-sm text-slate-600">Mortgage Calculator · Finance niche</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">Active</span>
                        <span className="px-2 py-1 rounded-md bg-violet-100 text-violet-700 text-xs font-medium">Conversion Assistant</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">8.7</div>
                    <div className="text-xs text-slate-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">234</div>
                    <div className="text-xs text-slate-500">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">22%</div>
                    <div className="text-xs text-slate-500">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">45</div>
                    <div className="text-xs text-slate-500">Leads</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>

              {/* Assistant Card 2 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Lead Qualification Assistant</h3>
                      <p className="text-sm text-slate-600">SEO Tools Landing · Marketing niche</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">Active</span>
                        <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">Lead Qualification</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">9.2</div>
                    <div className="text-xs text-slate-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">412</div>
                    <div className="text-xs text-slate-500">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">28%</div>
                    <div className="text-xs text-slate-500">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">89</div>
                    <div className="text-xs text-slate-500">Leads</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>

              {/* Assistant Card 3 */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Affiliate Recommendation Assistant</h3>
                      <p className="text-sm text-slate-600">Fitness Tools · Health niche</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">Paused</span>
                        <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">Monetization</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    <Pause className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">7.4</div>
                    <div className="text-xs text-slate-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">156</div>
                    <div className="text-xs text-slate-500">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">15%</div>
                    <div className="text-xs text-slate-500">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">22</div>
                    <div className="text-xs text-slate-500">Leads</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-slate-200">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Insights Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">AI Insights</h2>
            </div>

            {/* Top Questions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-900">Top Visitor Questions</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">"How much does this cost?"</p>
                  <p className="text-xs text-slate-500 mt-1">Asked 47 times this week</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">"Is there a free trial?"</p>
                  <p className="text-xs text-slate-500 mt-1">Asked 32 times this week</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">"Can I export results?"</p>
                  <p className="text-xs text-slate-500 mt-1">Asked 28 times this week</p>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-slate-900">Performance Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">Finance assistants retain visitors 38% longer</p>
                    <p className="text-xs text-slate-500 mt-1">vs. pages without assistants</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">Lead qualification increased conversions by 22%</p>
                    <p className="text-xs text-slate-500 mt-1">across all active assistants</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">Average conversation time: 2m 34s</p>
                    <p className="text-xs text-slate-500 mt-1">optimal engagement duration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-slate-900">AI Recommendations</h3>
              </div>
              <p className="text-sm text-slate-700">
                Your mortgage calculator receives high traffic. Deploy a conversion assistant to increase lead capture by an estimated 15-20%.
              </p>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white w-full">
                Create Assistant
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
