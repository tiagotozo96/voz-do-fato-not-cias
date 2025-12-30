import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";

import brasilNews from "@/assets/brasil-news.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import economiaNews from "@/assets/economia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";
import entretenimentoNews from "@/assets/entretenimento-news.jpg";
import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";

const allNews = [
  { title: "Tecnologia Transforma o Cenário Global de Comunicação", description: "Novas plataformas digitais revolucionam a forma como consumimos informação.", image: tecnologiaNews, category: "TECNOLOGIA", date: "23/11/2025" },
  { title: "Grande Operação Policial Desmantela Quadrilha", description: "Ação coordenada resulta em prisões importantes na capital.", image: policiaNews1, category: "POLÍCIA", date: "23/11/2025" },
  { title: "Economia Brasileira Apresenta Sinais de Recuperação", description: "Especialistas apontam crescimento em setores-chave.", image: economiaNews, category: "ECONOMIA", date: "23/11/2025" },
  { title: "Campeonato Nacional: Times se Preparam para Final", description: "Grande decisão promete movimentar milhões de torcedores.", image: esportesNews, category: "ESPORTES", date: "23/11/2025" },
  { title: "Cinema Nacional Ganha Destaque em Festival", description: "Produções brasileiras são aplaudidas em evento internacional.", image: entretenimentoNews, category: "ENTRETENIMENTO", date: "22/11/2025" },
  { title: "Brasil Participa de Reunião sobre Meio Ambiente", description: "País apresenta novas políticas ambientais em conferência.", image: brasilNews, category: "BRASIL", date: "22/11/2025" },
  { title: "Polícia Investiga Série de Crimes na Região", description: "Autoridades trabalham para identificar suspeitos.", image: policiaNews2, category: "POLÍCIA", date: "22/11/2025" },
  { title: "Inovação em Inteligência Artificial Chega ao Brasil", description: "Empresas brasileiras adotam tecnologias de ponta.", image: tecnologiaNews, category: "TECNOLOGIA", date: "21/11/2025" },
  { title: "Mercado Financeiro em Transformação", description: "Experts analisam mudanças estruturais no cenário econômico.", image: economiaNews, category: "ANÁLISE", date: "20/11/2025" },
];

const Noticias = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 mb-4">
              Todas as Notícias
            </h1>
            <p className="text-muted-foreground text-lg">
              Acompanhe as últimas notícias do Brasil e do mundo
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="medium" />
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allNews.map((news, index) => (
              <NewsCard key={index} {...news} />
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

export default Noticias;
