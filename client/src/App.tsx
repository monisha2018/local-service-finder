import { Routes, Route } from "react-router-dom";

import CustomerLayout from "./layouts/CustomerLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Home from "./pages/customer/Home";
import Search from "./pages/customer/Search";
import ProviderProfile from "./pages/customer/ProviderProfile";
import Booking from "./pages/customer/Booking";
import Dashboard from "./pages/customer/Dashboard";
import BookingsList from "./pages/customer/BookingsList";
import BookingDetail from "./pages/customer/BookingDetail";
import Favorites from "./pages/customer/Favorites";

import ProviderDashboard from "./pages/provider/Dashboard";
import CompleteProfile from "./pages/provider/CompleteProfile";
import BookingRequests from "./pages/provider/BookingRequests";
import Verification from "./pages/provider/Verification";
import Automations from "./pages/provider/Automations";
import ProviderServices from "./pages/provider/Services";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminProviders from "./pages/admin/Providers";
import AdminComplaints from "./pages/admin/Complaints";

import Messages from "./pages/shared/Messages";
import Notifications from "./pages/shared/Notifications";
import Profile from "./pages/shared/Profile";
import Complaints from "./pages/customer/Complaints";

export default function App() {
  return (
    <Routes>
      {/* Public + customer-facing */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />
        <Route path="/profile" element={<Profile />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route element={<ProtectedRoute allow={["CUSTOMER"]} />}>
          <Route path="/book/:providerId/:serviceId" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/complaints" element={<Complaints />} />
        </Route>
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Provider dashboard shell */}
            {/* Provider onboarding — protected, but standalone (no sidebar shell yet) */}
      <Route element={<ProtectedRoute allow={["PROVIDER"]} />}>
        <Route path="/provider/onboarding" element={<CompleteProfile />} />
      </Route>

      {/* Provider dashboard shell */}
      <Route element={<ProtectedRoute allow={["PROVIDER"]} />}>
        <Route element={<DashboardLayout variant="provider" />}>
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/bookings" element={<BookingRequests />} />
          <Route path="/provider/services" element={<ProviderServices />} />
          <Route path="/provider/verification" element={<Verification />} />
          <Route path="/provider/automations" element={<Automations />} />
        </Route>
      </Route>

      {/* Admin dashboard shell */}
      <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
        <Route element={<DashboardLayout variant="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
        </Route>
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
