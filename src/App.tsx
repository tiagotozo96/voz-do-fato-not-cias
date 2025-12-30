import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Category from "./pages/Category";
import Editorias from "./pages/Editorias";
import Noticias from "./pages/Noticias";
import WebStories from "./pages/WebStories";
import Videos from "./pages/Videos";
import Multimidia from "./pages/Multimidia";
import Contato from "./pages/Contato";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/categoria/:slug" element={<Category />} />
            <Route path="/editorias" element={<Editorias />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/web-stories" element={<WebStories />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/multimidia" element={<Multimidia />} />
            <Route path="/contato" element={<Contato />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
