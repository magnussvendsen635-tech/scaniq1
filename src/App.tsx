import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useKStore } from "@/store/useKStore";
import { useAuth } from "@/hooks/useAuth";
import { TabBar } from "@/components/TabBar";

import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import FoodScan from "./pages/FoodScan";
import Diary from "./pages/Diary";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    {children}
    <TabBar />
  </div>
);

const App = () => {
  const onboarded = useKStore((s) => s.onboarded);
  const { session, loading } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner theme="dark" />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
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
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
