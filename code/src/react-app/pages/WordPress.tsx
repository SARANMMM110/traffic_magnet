import DashboardLayout from "@/react-app/components/DashboardLayout";
import { EmptyState } from "@/react-app/components/EmptyState";
import { Globe } from "lucide-react";

export default function WordPress() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <EmptyState
          icon={<Globe className="w-12 h-12" style={{ color: "var(--brand)" }} />}
          title="WordPress Integration"
          description="Connect your WordPress sites to automatically publish your Ai Auto Traffic projects. This feature is coming soon."
          ctaLabel="Learn More"
          onCtaClick={() => window.open("https://docs.getmocha.com", "_blank")}
        />
      </div>
    </DashboardLayout>
  );
}
