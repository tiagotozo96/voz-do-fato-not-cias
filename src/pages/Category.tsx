import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";

import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import policiaNews3 from "@/assets/policia-news-3.jpg";
import policiaNews4 from "@/assets/policia-news-4.jpg";
import brasilNews from "@/assets/brasil-news.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import economiaNews from "@/assets/economia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";
import entretenimentoNews from "@/assets/entretenimento-news.jpg";

const categoryData: Record<string, { title: string; color: string; news: any[] }> = {
  brasil: {
    title: "Brasil",
    color: "from-green-950/20 to-green-900/10",
    news: [
      { title: "Governo anuncia novas medidas econômicas", description: "Pacote de medidas visa estimular crescimento e reduzir inflação.", image: brasilNews, category: "BRASIL", date: "23/11/2025" },
      { title: "Congresso aprova reforma tributária", description: "Nova legislação promete simplificar sistema de impostos.", image: brasilNews, category: "BRASIL", date: "23/11/2025" },
      { title: "Índices de emprego mostram recuperação", description: "Taxa de desemprego cai pelo terceiro mês consecutivo.", image: economiaNews, category: "BRASIL", date: "22/11/2025" },
      { title: "Programa social atinge milhões de famílias", description: "Iniciativa federal amplia cobertura de benefícios.", image: brasilNews, category: "BRASIL", date: "22/11/2025" },
    ],
  },
  policia: {
    title: "Polícia",
    color: "from-red-950/20 to-red-900/10",
    news: [
      { title: "Grande Operação Policial Desmantela Quadrilha na Capital", description: "Ação coordenada resulta em prisões e apreensões importantes.", image: policiaNews1, category: "POLÍCIA", date: "23/11/2025" },
      { title: "Polícia Investiga Série de Crimes na Região Metropolitana", description: "Autoridades trabalham para identificar suspeitos envolvidos.", image: policiaNews2, category: "POLÍCIA", date: "23/11/2025" },
      { title: "Coletiva de Imprensa Esclarece Detalhes de Operação", description: "Comando da polícia apresenta resultados de investigação.", image: policiaNews3, category: "POLÍCIA", date: "23/11/2025" },
      { title: "Perícia Criminal Trabalha em Caso de Grande Repercussão", description: "Equipe forense coleta evidências em importante investigação.", image: policiaNews4, category: "POLÍCIA", date: "22/11/2025" },
    ],
  },
  tecnologia: {
    title: "Tecnologia",
    color: "from-blue-950/20 to-blue-900/10",
    news: [
      { title: "Nova IA revoluciona setor de saúde", description: "Inteligência artificial auxilia diagnósticos médicos com precisão.", image: tecnologiaNews, category: "TECNOLOGIA", date: "23/11/2025" },
      { title: "Startup brasileira recebe investimento milionário", description: "Empresa de tecnologia atrai atenção de investidores internacionais.", image: tecnologiaNews, category: "TECNOLOGIA", date: "23/11/2025" },
      { title: "5G chega a novas capitais brasileiras", description: "Expansão da rede promete velocidades até 100x maiores.", image: tecnologiaNews, category: "TECNOLOGIA", date: "22/11/2025" },
      { title: "Cibersegurança: dicas para proteger seus dados", description: "Especialistas alertam sobre novos golpes online.", image: tecnologiaNews, category: "TECNOLOGIA", date: "22/11/2025" },
    ],
  },
  economia: {
    title: "Economia",
    color: "from-yellow-950/20 to-yellow-900/10",
    news: [
      { title: "Bolsa de valores atinge novo recorde", description: "Índice principal fecha em alta histórica impulsionado por commodities.", image: economiaNews, category: "ECONOMIA", date: "23/11/2025" },
      { title: "Banco Central mantém taxa de juros", description: "Decisão reflete cenário de inflação controlada.", image: economiaNews, category: "ECONOMIA", date: "23/11/2025" },
      { title: "Exportações brasileiras crescem 15%", description: "Agronegócio lidera vendas para o exterior.", image: economiaNews, category: "ECONOMIA", date: "22/11/2025" },
      { title: "Mercado imobiliário aquece nas capitais", description: "Financiamentos crescem com novas taxas de juros.", image: economiaNews, category: "ECONOMIA", date: "22/11/2025" },
    ],
  },
  esportes: {
    title: "Esportes",
    color: "from-emerald-950/20 to-emerald-900/10",
    news: [
      { title: "Seleção Brasileira convoca jogadores para eliminatórias", description: "Técnico anuncia lista com novidades para próximos jogos.", image: esportesNews, category: "ESPORTES", date: "23/11/2025" },
      { title: "Campeonato Brasileiro: líder vence e abre vantagem", description: "Time da casa conquista vitória importante na rodada.", image: esportesNews, category: "ESPORTES", date: "23/11/2025" },
      { title: "Atleta brasileiro quebra recorde mundial", description: "Competidor supera marca histórica em campeonato internacional.", image: esportesNews, category: "ESPORTES", date: "22/11/2025" },
      { title: "Copa do Brasil: finais prometem grandes jogos", description: "Decisão será disputada entre rivais históricos.", image: esportesNews, category: "ESPORTES", date: "22/11/2025" },
    ],
  },
  entretenimento: {
    title: "Entretenimento",
    color: "from-purple-950/20 to-purple-900/10",
    news: [
      { title: "Filme brasileiro concorre a prêmio internacional", description: "Produção nacional é indicada em festival de cinema.", image: entretenimentoNews, category: "ENTRETENIMENTO", date: "23/11/2025" },
      { title: "Show de artista internacional esgota ingressos", description: "Turnê passa pelo Brasil com apresentações em várias cidades.", image: entretenimentoNews, category: "ENTRETENIMENTO", date: "23/11/2025" },
      { title: "Série brasileira estreia em plataforma de streaming", description: "Produção original conquista público e crítica.", image: entretenimentoNews, category: "ENTRETENIMENTO", date: "22/11/2025" },
      { title: "Festival de música anuncia line-up completo", description: "Evento reúne artistas nacionais e internacionais.", image: entretenimentoNews, category: "ENTRETENIMENTO", date: "22/11/2025" },
    ],
  },
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categoryData[slug || ""] || categoryData.brasil;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className={`bg-gradient-to-r ${category.color} py-12 border-y-4 border-primary`}>
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-md">{category.title.toUpperCase()}</span>
                Últimas Notícias
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.news.map((news, index) => (
                <NewsCard key={index} {...news} />
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>

        <section className="container mx-auto px-4 pb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
              Mais Notícias de {category.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.news.map((news, index) => (
              <NewsCard key={`more-${index}`} {...news} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Category;
