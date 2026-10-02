import { NavLink } from "react-router-dom";

const PROVIDER_LINKS = [
  { to: "/provider/dashboard", label: "Provider Dashboard" },
  { to: "/provider/bookings", label: "Booking Requests" },
  { to: "/provider/services", label: "My Services" },
  { to: "/messages", label: "Messages" },
  { to: "/provider/verification", label: "Verification" },
  { to: "/provider/automations", label: "Settings" },
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Admin Overview" },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/providers", label: "Verification" },
  { to: "/admin/complaints", label: "Complaints" },
];

export default function Sidebar({ variant }: { variant: "provider" | "admin" }) {
  const links = variant === "provider" ? PROVIDER_LINKS : ADMIN_LINKS;
  return (
    <aside className="hidden md:block fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-surface-container border-r border-outline-variant overflow-y-auto">
      <nav className="flex flex-col gap-base p-sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center h-10 px-sm rounded-lg transition-colors font-label-lg text-label-lg ${
                isActive ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-variant font-normal"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}