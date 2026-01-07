import { NewsletterSubscription } from './NewsletterSubscription';

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-display font-bold mb-4 text-primary">
              Voz do Fato
            </h3>
            <p className="text-sm text-muted-foreground">
              Portal de notícias comprometido em trazer informação de qualidade
              e relevância para você.
            </p>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-bold mb-4">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/categoria/brasil" className="hover:text-primary transition-colors">Brasil</a></li>
              <li><a href="/categoria/policia" className="hover:text-primary transition-colors">Polícia</a></li>
              <li><a href="/categoria/mundo" className="hover:text-primary transition-colors">Mundo</a></li>
              <li><a href="/categoria/economia" className="hover:text-primary transition-colors">Economia</a></li>
              <li><a href="/categoria/esportes" className="hover:text-primary transition-colors">Esportes</a></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="/contato" className="hover:text-primary transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Publicidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterSubscription />
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Voz do Fato. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};