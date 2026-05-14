import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import StartWelcomeHero from "@/react-app/components/start/StartWelcomeHero";
import StartJourneyRail from "@/react-app/components/start/StartJourneyRail";
import StartOpportunityWorkspace from "@/react-app/components/start/StartOpportunityWorkspace";
import StartGuidedActions from "@/react-app/components/start/StartGuidedActions";
import StartKnowledgeAccordion from "@/react-app/components/start/StartKnowledgeAccordion";
import {
  StartInsightDesktopCanvas,
  StartInsightMobileStrip,
} from "@/react-app/components/start/StartFloatingInsights";
import { ArrowRight, Command, Sparkles } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep] = useState(1);

  const firstName = useMemo(() => {
    const raw = user?.google_user_data?.name?.trim();
    if (raw) return raw.split(/\s+/)[0] ?? "Operator";
    const email = user?.google_user_data?.email;
    if (email) return email.split("@")[0] ?? "Operator";
    return "Operator";
  }, [user]);

  return (
    <DashboardLayout>
      <div className="font-tm relative -mx-6 -mt-6 min-h-0 px-6 pb-16 pt-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,520px)] max-w-[1100px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.12),transparent),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(56,189,248,0.08),transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1180px] space-y-8 lg:space-y-10">
          <header className="flex flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Traffic Magnet · Start
            </p>
            <p className="text-sm text-slate-600">
              Guided operating system · intelligence-first onboarding
            </p>
          </header>

          <StartWelcomeHero firstName={firstName} />

          <div className="lg:hidden">
            <StartInsightMobileStrip />
          </div>

          <StartJourneyRail activeIndex={activeStep} />

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-8 lg:col-span-8 lg:space-y-10">
              <StartOpportunityWorkspace />
              <StartGuidedActions />
              <StartKnowledgeAccordion />
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <div className="hidden lg:block lg:sticky lg:top-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Live intelligence
                </p>
                <StartInsightDesktopCanvas />
              </div>

              <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-950/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  <Command className="h-3.5 w-3.5 text-violet-500" strokeWidth={2} />
                  Command lane
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">
                  Ship your first growth asset when the blueprint confidence crosses the deployment
                  threshold.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/projects/new")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:border-violet-200 hover:bg-white"
                >
                  <Sparkles className="h-4 w-4 text-violet-600" strokeWidth={2} />
                  Open new workspace
                  <ArrowRight className="h-4 w-4 text-slate-400" strokeWidth={2} />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
