import { Outlet, Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="font-semibold text-xl text-text-primary">Local Service Finder</span>
        </Link>
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
