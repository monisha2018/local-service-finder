import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import Icon from "../ui/Icon";

const CUSTOMER_LINKS = [
  { path: "/", label: "Home" },
  { path: "/search", label: "Find Services" },
  { path: "/dashboard", label: "Bookings" },
  { path: "/favorites", label: "Favorites" },
  { path: "/messages", label: "Messages" },
  { path: "/complaints", label: "Complaints" }
];

const OTHER_LINKS = [{ path: "/search", label: "Find Services" }];
const PROVIDER_LINK = { path: "/provider/dashboard", label: "My Dashboard" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = !user
    ? OTHER_LINKS
    : user.role === "CUSTOMER"
    ? CUSTOMER_LINKS
    : user.role === "PROVIDER"
    ? [...OTHER_LINKS, PROVIDER_LINK]
    : OTHER_LINKS;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_4px_12px_rgba(124,58,237,0.05)]">
      <div className="h-[72px] max-w-container-max mx-auto px-md lg:px-lg flex items-center justify-between">
        <Link to="/" className="flex items-center gap-xs">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="verified" className="text-on-primary text-[20px]" />
          </div>
          <span className="font-headline-md text-headline-md tracking-tight text-on-surface">Local Service Finder</span>
        </Link>

        <nav className="hidden md:flex items-center gap-md h-full">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors flex items-center h-full text-label-lg font-label-lg border-b-2 ${
                  active ? "text-primary border-primary" : "text-on-surface-variant hover:text-primary border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-md">
          {user ? (
            <>
              <button
                onClick={() => navigate("/notifications")}
                className="relative text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              >
                <Icon name="notifications" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate(user.role === "PROVIDER" ? "/provider/dashboard" : user.role === "ADMIN" ? "/admin/dashboard" : "/profile")}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer text-on-primary text-[13px] font-semibold"
                title={user.name}
              >
                {user.name[0]}
              </button>
              <button onClick={logout} className="text-label-md font-label-md text-on-surface-variant hover:text-error transition-colors hidden md:block">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-label-lg font-label-lg text-primary">Log In</Link>
              <Link
                to="/register"
                className="h-10 px-md bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}