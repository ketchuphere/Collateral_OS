import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import NewProperty from "@/pages/NewProperty";
import Assessments from "@/pages/Assessments";
import AssessmentReport from "@/pages/AssessmentReport";
import Loans from "@/pages/Loans";
import LoanDetail from "@/pages/LoanDetail";
import NewLoan from "@/pages/NewLoan";
import Alerts from "@/pages/Alerts";
import AICopilot from "@/pages/AICopilot";
import GeographicIntelligence from "@/pages/GeographicIntelligence";
import StressSimulator from "@/pages/StressSimulator";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/properties" component={Properties} />
        <Route path="/properties/new" component={NewProperty} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/assessments/:id" component={AssessmentReport} />
        <Route path="/loans" component={Loans} />
        <Route path="/loans/new" component={NewLoan} />
        <Route path="/loans/:id" component={LoanDetail} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/ai-copilot" component={AICopilot} />
        <Route path="/geo-intelligence" component={GeographicIntelligence} />
        <Route path="/stress-simulator" component={StressSimulator} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}
