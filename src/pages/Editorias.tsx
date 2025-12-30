import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

import catBrasil from "@/assets/cat-brasil.jpg";
import catPolicia from "@/assets/cat-policia.jpg";
import catTech from "@/assets/cat-tech.jpg";
import catEconomia from "@/assets/cat-economia.jpg";
import catEsportes from "@/assets/cat-esportes.jpg";
import catEntretenimento from "@/assets/cat-entretenimento.jpg";

const categories = [
  { name: "Brasil", slug: "brasil", icon: catBrasil, description: "Notícias sobre política, economia e acontecimentos nacionais" },
  { name: "Polícia", slug: "policia", icon: catPolicia, description: "Cobertura de segurança pública e operações policiais" },
  { name: "Tecnologia", slug: "tecnologia", icon: catTech, description: "Inovações, startups e tendências tecnológicas" },
  { name: "Economia", slug: "economia", icon: catEconomia, description: "Mercado financeiro, negócios e indicadores econômicos" },
  { name: "Esportes", slug: "esportes", icon: catEsportes, description: "Futebol, olimpíadas e competições esportivas" },
  { name: "Entretenimento", slug: "entretenimento", icon: catEntretenimento, description: "Cinema, música, TV e celebridades" },
];

const Editorias = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Editorias
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore todas as nossas categorias de notícias
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/categoria/${category.slug}`}
                className="group bg-card rounded-lg shadow-md overflow-hidden hover:shadow-elevated transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.icon}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <h2 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                    {category.name}
                  </h2>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Editorias;
