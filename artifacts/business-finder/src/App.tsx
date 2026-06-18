import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router as WouterRouter, Switch } from "wouter";

import ChatBot from "@/components/ChatBot";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Contact from "@/pages/Contact";
import History from "@/pages/History";
import Home from "@/pages/Home";
import MaBoutique from "@/pages/MaBoutique";
import NotFound from "@/pages/not-found";
import PremiumToolPage from "@/pages/PremiumToolPage";
import Pricing from "@/pages/Pricing";
import ShopBuilder from "@/pages/ShopBuilder";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={Contact} />
      <Route path="/history" component={History} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/shop-builder" component={ShopBuilder} />
      <Route path="/ma-boutique" component={MaBoutique} />
      <Route path="/premium/:workspace/:module" component={PremiumToolPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
        <ChatBot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
