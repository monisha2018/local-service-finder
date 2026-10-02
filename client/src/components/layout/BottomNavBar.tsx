import { NavLink } from "react-router-dom";
import { Home, Search, CalendarCheck, MessageCircle, User } from "lucide-react";

const TABS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/dashboard", icon: CalendarCheck, label: "Bookings" },
  { to: "/messages", icon: MessageCircle, label: "Chat" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNavBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around h-16">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `flex flex-col items-center gap-0.5 text-[10px] ${isActive ? "text-primary" : "text-text-secondary"}`}
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
