import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import Icon from "../ui/Icon";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

    const homePath = user?.role === "PROVIDER" ? "/provider/dashboard" : user?.role === "ADMIN" ? "/admin/dashboard" : "/";

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-sm border-b border-outline-variant">
      <div className="h-16 px-md flex items-center justify-between">
        <Link to={homePath} className="flex items-center gap-xs">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Icon name="verified" className="text-on-primary text-[20px]" />
          </div>
          <span className="font-headline-md text-headline-md text-on-surface hidden sm:inline">Local Service Finder</span>
        </Link>
        <div className="flex items-center gap-md">
          <button onClick={() => navigate("/notifications")} className="relative text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="notifications" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
                    <button
            onClick={() => navigate(user?.role === "PROVIDER" ? "/provider/automations" : "/profile")}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-[13px] font-semibold"
            title={user?.name}
          >
            {user?.name?.[0]}
          </button>
          <button onClick={logout} className="text-label-md font-label-md text-on-surface-variant hover:text-error transition-colors hidden md:block">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
