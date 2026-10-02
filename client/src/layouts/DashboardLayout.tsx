import { Outlet } from "react-router-dom";
import DashboardHeader from "../components/layout/DashboardHeader";
import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout({ variant }: { variant: "provider" | "admin" }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <Sidebar variant={variant} />
      <main className="pt-16 md:pl-64 w-full min-h-screen">
        <div className="p-lg max-w-container-max mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
