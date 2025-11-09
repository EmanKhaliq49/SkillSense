import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardNew from "./pages/DashboardNew";
import Upload from "./pages/Upload";
import ConnectSources from "./pages/ConnectSources";
import DataSources from "./pages/DataSources";
import Goals from "./pages/Goals";
import CareerGoals from "./pages/CareerGoals";
import JobMatching from "./pages/JobMatching";
import TeamAnalysis from "./pages/TeamAnalysis";
import Settings from "./pages/Settings";
import LearningPath from "./pages/LearningPath";
import UserGuide from "./pages/UserGuide";
import SkillComparison from "./pages/SkillComparison";
import MySkills from "./pages/MySkills";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Routes with AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardNew />} />
            <Route path="/dashboard-old" element={<Dashboard />} />
            <Route path="/my-skills" element={<MySkills />} />
            <Route path="/skill-comparison" element={<SkillComparison />} />
            <Route path="/goals" element={<CareerGoals />} />
            <Route path="/goals-old" element={<Goals />} />
            <Route path="/jobs" element={<JobMatching />} />
            <Route path="/team" element={<TeamAnalysis />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Legacy routes without layout */}
          <Route path="/upload" element={<Upload />} />
          <Route path="/connect" element={<ConnectSources />} />
          <Route path="/sources" element={<DataSources />} />
          <Route path="/guide" element={<UserGuide />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
