import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryCircle } from "@/components/CategoryCircle";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";

import brasilNews from "@/assets/brasil-news.jpg";
import mundoNews from "@/assets/mundo-news.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import economiaNews from "@/assets/economia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";
import entretenimentoNews from "@/assets/entretenimento-news.jpg";
import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import policiaNews3 from "@/assets/policia-news-3.jpg";
import policiaNews4 from "@/assets/policia-news-4.jpg";

import catBrasil from "@/assets/cat-brasil.jpg";
import catMundo from "@/assets/cat-mundo.jpg";
import catTech from "@/assets/cat-tech.jpg";
import catEconomia from "@/assets/cat-economia.jpg";
import catEsportes from "@/assets/cat-esportes.jpg";
import catEntretenimento from "@/assets/cat-entretenimento.jpg";

const Index = () => {
  const categories = [
    { name: "Brasil", icon: catBrasil },
    { name: "Polícia", icon: catMundo },
    { name: "Tecnologia", icon: catTech },
    { name: "Economia", icon: catEconomia },
    { name: "Esportes", icon: catEsportes },
    { name: "Entretenimento", icon: catEntretenimento },
  ];

  const featuredNews = {
    title: "Tecnologia Transforma o Cenário Global de Comunicação",
    description: "Novas plataformas digitais revolucionam a forma como consumimos informação e nos conectamos com o mundo.",
    image: tecnologiaNews,
    category: "TECNOLOGIA",
    date: "23/11/2025 - Tecnologia",
  };

  const policeNews = [
    {
      title: "Grande Operação Policial Desmantela Quadrilha na Capital",
      description: "Ação coordenada resulta em prisões e apreensões importantes.",
      image: policiaNews1,
      category: "POLÍCIA",
      date: "23/11/2025",
    },
    {
      title: "Polícia Investiga Série de Crimes na Região Metropolitana",
      description: "Autoridades trabalham para identificar suspeitos envolvidos.",
      image: policiaNews2,
      category: "POLÍCIA",
      date: "23/11/2025",
    },
    {
      title: "Coletiva de Imprensa Esclarece Detalhes de Operação",
      description: "Comando da polícia apresenta resultados de investigação de meses.",
      image: policiaNews3,
      category: "POLÍCIA",
      date: "23/11/2025",
    },
    {
      title: "Perícia Criminal Trabalha em Caso de Grande Repercussão",
      description: "Equipe forense coleta evidências em importante investigação.",
      image: policiaNews4,
      category: "POLÍCIA",
      date: "22/11/2025",
    },
  ];

  const recentNews = [
    {
      title: "Economia Brasileira Apresenta Sinais de Recuperação",
      description: "Especialistas apontam crescimento em setores-chave da economia nacional.",
      image: economiaNews,
      category: "ECONOMIA",
      date: "23/11/2025",
    },
    {
      title: "Campeonato Nacional: Times se Preparam para Final",
      description: "Grande decisão promete movimentar milhões de torcedores pelo país.",
      image: esportesNews,
      category: "ESPORTES",
      date: "23/11/2025",
    },
    {
      title: "Cinema Nacional Ganha Destaque em Festival Internacional",
      description: "Produções brasileiras são aplaudidas em importante evento de cinema.",
      image: entretenimentoNews,
      category: "ENTRETENIMENTO",
      date: "22/11/2025",
    },
    {
      title: "Brasil Participa de Importante Reunião sobre Meio Ambiente",
      description: "País apresenta novas políticas ambientais em conferência internacional.",
      image: brasilNews,
      category: "BRASIL",
      date: "22/11/2025",
    },
    {
      title: "Acontecimentos Globais Marcam Semana Internacional",
      description: "Principais eventos ao redor do mundo impactam cenário geopolítico.",
      image: mundoNews,
      category: "MUNDO",
      date: "22/11/2025",
    },
    {
      title: "Inovação em Inteligência Artificial Chega ao Brasil",
      description: "Empresas brasileiras adotam tecnologias de ponta para otimizar processos.",
      image: tecnologiaNews,
      category: "TECNOLOGIA",
      date: "21/11/2025",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Top Ad Banner */}
        <section className="container mx-auto px-4 py-4">
          <AdBanner size="large" />
        </section>

        {/* Categories Section */}
        <section className="bg-muted py-8 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-8 overflow-x-auto pb-4 justify-center scrollbar-hide">
              {categories.map((category) => (
                <CategoryCircle
                  key={category.name}
                  name={category.name}
                  icon={category.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured News */}
        <section className="container mx-auto px-4 py-12">
          <NewsCard {...featuredNews} featured={true} />
        </section>

        {/* Police News Section - Highlighted */}
        <section className="bg-gradient-to-r from-red-950/20 to-red-900/10 py-12 border-y-4 border-primary">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-md">POLÍCIA</span>
                Notícias Policiais em Destaque
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {policeNews.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>
          </div>
        </section>

        {/* Mid Ad Banner */}
        <section className="container mx-auto px-4 py-8">
          <AdBanner size="medium" />
        </section>

        {/* Recent News Grid */}
        <section className="container mx-auto px-4 pb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
              Últimas Notícias
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNews.map((news, index) => (
              <NewsCard key={index} {...news} />
            ))}
          </div>
        </section>

        {/* Bottom Ad Banner */}
        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>

        {/* More News Section */}
        <section className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
                Destaques da Semana
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NewsCard
                title="Análise: Mercado Financeiro em Transformação"
                description="Experts analisam mudanças estruturais no cenário econômico brasileiro e internacional."
                image={economiaNews}
                category="ANÁLISE"
                date="20/11/2025"
              />
              <NewsCard
                title="Esporte e Sociedade: O Impacto Social do Futebol"
                description="Como o esporte mais popular do país influencia questões sociais importantes."
                image={esportesNews}
                category="ESPECIAL"
                date="20/11/2025"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
