import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import BottomNavBar from "../components/layout/BottomNavBar";
import Footer from "../components/layout/Footer";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-[72px] pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNavBar />
    </div>
  );
}
