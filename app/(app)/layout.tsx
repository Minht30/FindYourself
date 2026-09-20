import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-0">
        <Sidebar />
        <main className="overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
