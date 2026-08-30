import { Outlet, Link } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import logoDarkImg from "@/assets/logo_dark.png";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <TopNavbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoDarkImg} alt="Dr's Kart Logo" className="h-10 w-auto" />
              </div>
              <p className="text-sm">India's trusted B2B healthcare equipment marketplace for hospitals, clinics, and diagnostic centers.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/search" className="hover:text-emerald-400 transition-colors">Browse All Equipment</a></li>
                <li><a href="/search?category=MRI" className="hover:text-emerald-400 transition-colors">MRI Machines</a></li>
                <li><a href="/search?category=Ultrasound" className="hover:text-emerald-400 transition-colors">Ultrasound</a></li>
                <li><a href="/search?condition=Refurbished" className="hover:text-emerald-400 transition-colors">Refurbished Devices</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/kyc" className="hover:text-emerald-400 transition-colors">Start Selling</a></li>
                <li><a href="/dashboard/listings" className="hover:text-emerald-400 transition-colors">My Listings</a></li>
                <li><a href="/dashboard/inquiries" className="hover:text-emerald-400 transition-colors">Manage Inquiries</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support & Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <span>&copy; {new Date().getFullYear()} Dr's Kart Marketplace. All rights reserved.</span>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-slate-500">
              <span>Made for India's Healthcare Ecosystem</span>
              <span className="hidden sm:inline text-slate-800">|</span>
              <span>
                Designed & Developed By{" "}
                <a
                  href="https://www.azyntrex.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                  Azyntrex Tech Services Pvt Ltd
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
