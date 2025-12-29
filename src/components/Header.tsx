import { Search, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card shadow-md">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#" className="hover:text-accent transition-colors">RSS</a>
            <span>|</span>
            <a href="#" className="hover:text-accent transition-colors">Twitter</a>
            <span>|</span>
            <a href="#" className="hover:text-accent transition-colors">Instagram</a>
            <span>|</span>
            <a href="#" className="hover:text-accent transition-colors">Facebook</a>
            <span>|</span>
            <Link to={user ? "/admin" : "/auth"} className="flex items-center gap-1 hover:text-accent transition-colors">
              <User className="h-3 w-3" />
              {user ? "Painel" : "Login"}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Logo */}
          <div className="flex-1 lg:flex-initial">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-primary">
              Voz do Fato
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Portal de Notícias Gerenciável
            </p>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Buscar notícias..."
                className="pr-10"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Icon Mobile */}
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} lg:block mt-4 lg:mt-6`}>
          <ul className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-2 lg:gap-6 text-sm font-medium">
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Home</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Editorias</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Notícias</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Web Stories</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Vídeos</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Multimídia</a></li>
            <li><a href="#" className="block py-2 lg:py-0 hover:text-primary transition-colors">Contato</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
