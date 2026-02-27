import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import DeveloperPage from "./pages/DeveloperPage";
import AgentPage from "./pages/AgentPage";
import AuthPage from "./pages/AuthPage";
import StatusPage from "./pages/StatusPage";
import TestingPage from "./pages/TestingPage";
import PlanningPage from "./pages/PlanningPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout><DeveloperPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/agent" element={
              <ProtectedRoute>
                <MainLayout><AgentPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/status" element={
              <ProtectedRoute>
                <MainLayout><StatusPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/testing" element={
              <ProtectedRoute>
                <MainLayout><TestingPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/planning" element={
              <ProtectedRoute>
                <MainLayout><PlanningPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute>
                <MainLayout><TeamPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout><SettingsPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
