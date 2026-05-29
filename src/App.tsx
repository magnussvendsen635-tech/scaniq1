import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useKStore } from "@/store/useKStore";
import { useAuth } from "@/hooks/useAuth";
import { TabBar } from "@/components/TabBar";

const RTL_LANGS = new Set(["ar", "ur", "he", "fa"]);

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import FoodScan from "./pages/FoodScan";

import Diary from "./pages/Diary";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import Weight from "./pages/Weight";
import Favorites from "./pages/Favorites";
import Recipes from "./pages/Recipes";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DataPrivacy from "./pages/DataPrivacy";
import Help from "./pages/Help";
import Admin from "./pages/Admin";
import Reminders from "./pages/Reminders";
import NotFound from "./pages/NotFound.tsx";
import { CookieConsent } from "@/components/CookieConsent";
import { UpgradeFab } from "@/components/UpgradeFab";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <UpgradeFab />
    {children}
    <TabBar />
  </div>
);

const App = () => {
  const onboarded = useKStore((s) => s.onboarded);
  const language = useKStore((s) => s.language);
  const reminders = useKStore((s) => s.reminders);
  const meals = useKStore((s) => s.meals);
  const { session, loading } = useAuth();

  useEffect(() => {
    const base = (language || "en").split("-")[0];
    const isRtl = RTL_LANGS.has(base);
    document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", base);
  }, [language]);

  // Enforce strict daily streak: reset to 0 if a full local-calendar day was missed.
  useEffect(() => {
    const check = () => useKStore.getState().checkStreakExpiry();
    check();
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    const interval = window.setInterval(check, 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
    };
  }, []);

  // Re-schedule native reminders whenever settings or logged meals change.
  useEffect(() => {
    if (!reminders.enabled) return;
    import("@/lib/notifications").then((m) => m.rescheduleReminders({ reminders, meals }));
  }, [reminders, meals]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner theme="dark" />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/onboarding" element={<Onboarding />} />
            {loading ? (
              <Route path="*" element={<div className="min-h-screen bg-background" />} />
            ) : !session ? (
              <Route path="*" element={<Navigate to="/auth" replace />} />
            ) : !onboarded ? (
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
            ) : (
              <>
                <Route path="/" element={<Shell><Home /></Shell>} />
                <Route path="/scan" element={<Shell><FoodScan /></Shell>} />
                
                <Route path="/diary" element={<Shell><Diary /></Shell>} />
                <Route path="/workouts" element={<Shell><Workouts /></Shell>} />
                <Route path="/progress" element={<Shell><Progress /></Shell>} />
                <Route path="/profile" element={<Shell><Profile /></Shell>} />
                <Route path="/settings" element={<Shell><Settings /></Shell>} />
                <Route path="/premium" element={<Shell><Premium /></Shell>} />
                <Route path="/weight" element={<Shell><Weight /></Shell>} />
                <Route path="/favorites" element={<Shell><Favorites /></Shell>} />
                <Route path="/recipes" element={<Shell><Recipes /></Shell>} />
                <Route path="/help" element={<Shell><Help /></Shell>} />
                <Route path="/data-privacy" element={<Shell><DataPrivacy /></Shell>} />
                <Route path="/admin" element={<Shell><Admin /></Shell>} />
                <Route path="/reminders" element={<Shell><Reminders /></Shell>} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
          <CookieConsent />
        </BrowserRouter>
        <SplashScreen />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
