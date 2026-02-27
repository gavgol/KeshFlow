import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DirectionProvider } from "@radix-ui/react-direction";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/Dashboard";
import CalendarPage from "./pages/Calendar";
import KanbanPage from "./pages/Kanban";
import ContactsPage from "./pages/Contacts";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import BookingPage from "./pages/BookingPage";

const queryClient = new QueryClient();

const App = () => (
  <DirectionProvider dir="rtl">
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="keshflow-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/book/:business_slug" element={<BookingPage />} />

                {/* Protected routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/kanban" element={<KanbanPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </DirectionProvider>
);

export default App;
