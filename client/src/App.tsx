import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SavingsLab from "@/pages/SavingsLab";
import WealthTracker from "@/pages/WealthTracker";
import FinScore from "@/pages/FinScore";
import Contact from "@/pages/Contact";
import Info from "@/pages/Info";
import RetirementPlanner from "@/pages/RetirementPlanner";
import InsuranceGapGuide from "@/pages/InsuranceGapGuide";
import CaServices from "@/pages/CaServices";
import CaFaq from "@/pages/CaFaq";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/savings-lab" component={SavingsLab} />
      <Route path="/wealth-tracker" component={WealthTracker} />
      <Route path="/fin-score" component={FinScore} />
      <Route path="/retirement-planner" component={RetirementPlanner} />
      <Route path="/insurance-gap-guide" component={InsuranceGapGuide} />
      <Route path="/ca-services" component={CaServices} />
      <Route path="/ca-faq" component={CaFaq} />
      <Route path="/info" component={Info} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
