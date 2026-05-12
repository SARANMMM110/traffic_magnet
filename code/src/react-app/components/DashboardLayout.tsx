import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="app-shell flex h-screen overflow-hidden md:p-3 md:gap-3">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full md:w-auto md:rounded-[24px]">
        {children}
      </main>
    </div>
  );
}
