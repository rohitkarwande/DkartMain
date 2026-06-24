import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardOverview } from "./pages/dashboard/Overview";
import { SellEquipment } from "./pages/dashboard/SellEquipment";
import { Listings } from "./pages/dashboard/Listings";
import { Inquiries } from "./pages/dashboard/Inquiries";
import { Chat } from "./pages/dashboard/Chat";
import { Profile } from "./pages/dashboard/Profile";
import { Home } from "./pages/marketplace/Home";
import { Search } from "./pages/marketplace/Search";
import { EquipmentDetails } from "./pages/marketplace/EquipmentDetails";
import { AuthPage } from "./pages/auth/AuthPage";
import { KycVerification } from "./pages/auth/KycVerification";
import { SellerProtectedRoute } from "./components/auth/SellerProtectedRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* All routes wrapped in MainLayout (gives TopNavbar + Footer) */}
          <Route element={<MainLayout />}>
            
            {/* ── PUBLIC MARKETPLACE ROUTES ── */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/equipment/:id" element={<EquipmentDetails />} />
            
            {/* ── AUTH ROUTES ── */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/kyc" element={<KycVerification />} />

            {/* ── DASHBOARD ROUTES (with sidebar) ── */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardOverview />} />
              <Route path="listings" element={<Listings />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="profile" element={<Profile />} />
              <Route path="chat" element={<Chat />} />
            </Route>

            {/* ── SELLER-ONLY ROUTE (gated by KYC/role) ── */}
            <Route element={<SellerProtectedRoute />}>
              <Route path="/sell" element={<SellEquipment />} />
              <Route path="/edit/:id" element={<SellEquipment />} />
            </Route>

          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
