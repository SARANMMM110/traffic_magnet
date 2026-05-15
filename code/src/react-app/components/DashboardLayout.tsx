import type { ReactNode } from "react";
import { cn } from "@/react-app/lib/utils";
import WorkspaceSidebar from "./WorkspaceSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  /** Override outer shell (default: slate/indigo/purple gradient). */
  shellClassName?: string;
  /** Override main scroll region. */
  mainClassName?: string;
  /** Override inner padding wrapper around children. */
  innerClassName?: string;
}

export default function DashboardLayout({
  children,
  shellClassName,
  mainClassName,
  innerClassName,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20",
        shellClassName,
      )}
    >
      <WorkspaceSidebar />
      <main className={cn("flex-1 overflow-y-auto", mainClassName)}>
        <div className={cn("min-h-full p-6 lg:p-8", innerClassName)}>{children}</div>
      </main>
    </div>
  );
}
