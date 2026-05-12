import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="app-shell flex h-screen overflow-hidden md:p-4 md:gap-4">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full md:w-auto md:rounded-[28px]">
        {children}
      </main>
    </div>
  );
}
