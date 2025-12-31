import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Calendar, Clock, User, Eye, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import brasilNews from "@/assets/brasil-news.jpg";
import policiaNews1 from "@/assets/policia-news-1.jpg";
import policiaNews2 from "@/assets/policia-news-2.jpg";
import tecnologiaNews from "@/assets/tecnologia-news.jpg";
import economiaNews from "@/assets/economia-news.jpg";
import esportesNews from "@/assets/esportes-news.jpg";
import entretenimentoNews from "@/assets/entretenimento-news.jpg";

// Helper to generate slug
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60);

// All placeholder news data - slugs auto-generated from titles
const allNewsItems = [
  { title: "Tecnologia Transforma o Cenário Global de Comunicação", category: "Tecnologia", categorySlug: "tecnologia", author: "Carlos Tech", date: "23 de Novembro, 2025", readTime: "5 min", views: 2340, image: tecnologiaNews, content: ["Novas plataformas digitais revolucionam a forma como consumimos informação e nos conectamos com o mundo.", "A transformação digital está acelerando em todos os setores da economia global.", "Empresas de tecnologia lideram essa mudança com inovações constantes."], tags: ["Tecnologia", "Digital", "Inovação"] },
  { title: "Grande Operação Policial Desmantela Quadrilha na Capital", category: "Polícia", categorySlug: "policia", author: "Maria Santos", date: "23 de Novembro, 2025", readTime: "4 min", views: 1890, image: policiaNews1, content: ["Ação coordenada resulta em prisões e apreensões importantes.", "A operação foi resultado de meses de investigação.", "Autoridades prometem mais ações para combater o crime organizado."], tags: ["Polícia", "Segurança", "Operação"] },
  { title: "Polícia Investiga Série de Crimes na Região Metropolitana", category: "Polícia", categorySlug: "policia", author: "Pedro Lima", date: "23 de Novembro, 2025", readTime: "3 min", views: 1450, image: policiaNews2, content: ["Autoridades trabalham para identificar suspeitos envolvidos.", "Casos estão sendo investigados em conjunto.", "População é orientada a denunciar atividades suspeitas."], tags: ["Polícia", "Investigação", "Crime"] },
  { title: "Economia Brasileira Apresenta Sinais de Recuperação", category: "Economia", categorySlug: "economia", author: "Ana Economia", date: "23 de Novembro, 2025", readTime: "6 min", views: 3200, image: economiaNews, content: ["Especialistas apontam crescimento em setores-chave da economia nacional.", "O PIB cresceu acima das expectativas no último trimestre.", "Investimentos estrangeiros também apresentam alta significativa."], tags: ["Economia", "PIB", "Crescimento"] },
  { title: "Campeonato Nacional: Times se Preparam para Final", category: "Esportes", categorySlug: "esportes", author: "João Esporte", date: "23 de Novembro, 2025", readTime: "4 min", views: 5600, image: esportesNews, content: ["Grande decisão promete movimentar milhões de torcedores pelo país.", "Os dois finalistas chegam em ótima forma para o confronto.", "Ingressos esgotados em poucas horas após início das vendas."], tags: ["Esportes", "Futebol", "Final"] },
  { title: "Cinema Nacional Ganha Destaque em Festival Internacional", category: "Entretenimento", categorySlug: "entretenimento", author: "Julia Arte", date: "22 de Novembro, 2025", readTime: "5 min", views: 1800, image: entretenimentoNews, content: ["Produções brasileiras são aplaudidas em importante evento de cinema.", "Diretores brasileiros receberam reconhecimento internacional.", "O cinema nacional vive um momento de renascimento criativo."], tags: ["Cinema", "Festival", "Cultura"] },
  { title: "Brasil Participa de Importante Reunião sobre Meio Ambiente", category: "Brasil", categorySlug: "brasil", author: "Roberto Ambiente", date: "22 de Novembro, 2025", readTime: "5 min", views: 2100, image: brasilNews, content: ["País apresenta novas políticas ambientais em conferência internacional.", "Compromissos foram firmados para redução de emissões.", "A preservação da Amazônia foi tema central das discussões."], tags: ["Brasil", "Meio Ambiente", "Política"] },
  { title: "Governo anuncia novas medidas econômicas", category: "Brasil", categorySlug: "brasil", author: "João Silva", date: "23 de Novembro, 2025", readTime: "5 min", views: 1250, image: brasilNews, content: ["Pacote de medidas visa estimular crescimento e reduzir inflação.", "Empresas terão acesso a linhas de crédito especiais.", "Medidas entram em vigor a partir do próximo mês."], tags: ["Economia", "Governo", "Brasil"] },
  { title: "Nova IA revoluciona setor de saúde", category: "Tecnologia", categorySlug: "tecnologia", author: "Carlos Tech", date: "23 de Novembro, 2025", readTime: "6 min", views: 4500, image: tecnologiaNews, content: ["Inteligência artificial auxilia diagnósticos médicos com precisão.", "Hospitais já estão implementando a nova tecnologia.", "Resultados preliminares mostram aumento na eficiência dos tratamentos."], tags: ["IA", "Saúde", "Tecnologia"] },
  { title: "Seleção Brasileira convoca jogadores para eliminatórias", category: "Esportes", categorySlug: "esportes", author: "João Esporte", date: "23 de Novembro, 2025", readTime: "3 min", views: 8900, image: esportesNews, content: ["Técnico anuncia lista com novidades para próximos jogos.", "Novos talentos ganham oportunidade na seleção.", "Próximos jogos serão decisivos para classificação."], tags: ["Seleção", "Futebol", "Convocação"] },
  { title: "Bolsa de valores atinge novo recorde", category: "Economia", categorySlug: "economia", author: "Ana Economia", date: "23 de Novembro, 2025", readTime: "4 min", views: 3800, image: economiaNews, content: ["Índice principal fecha em alta histórica impulsionado por commodities.", "Investidores estão otimistas com o cenário econômico.", "Analistas projetam continuidade da tendência de alta."], tags: ["Bolsa", "Investimentos", "Economia"] },
  { title: "Filme brasileiro concorre a prêmio internacional", category: "Entretenimento", categorySlug: "entretenimento", author: "Julia Arte", date: "23 de Novembro, 2025", readTime: "4 min", views: 2200, image: entretenimentoNews, content: ["Produção nacional é indicada em festival de cinema.", "O filme retrata a realidade brasileira de forma única.", "Elenco e equipe celebram a indicação histórica."], tags: ["Cinema", "Prêmio", "Cultura"] },
];

// Create lookup by slug
const newsData: Record<string, typeof allNewsItems[0]> = {};
allNewsItems.forEach(item => {
  const slug = generateSlug(item.title);
  newsData[slug] = item;
});

// Related news placeholder
const relatedNews = allNewsItems.slice(0, 3).map(item => ({
  slug: generateSlug(item.title),
  title: item.title,
  image: item.image,
  category: item.category,
}));

const NoticiaDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const news = slug ? newsData[slug] : null;

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = news?.title || "";
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado!",
          description: "O link da notícia foi copiado para a área de transferência.",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  if (!news) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Notícia não encontrada</h1>
            <p className="text-muted-foreground mb-6">A notícia que você procura não existe ou foi removida.</p>
            <Link to="/noticias">
              <Button>Voltar para Notícias</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/categoria/${news.categorySlug}`} className="hover:text-primary transition-colors">
            {news.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground line-clamp-1">{news.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Category Badge */}
            <Link 
              to={`/categoria/${news.categorySlug}`}
              className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded mb-4 hover:bg-primary/90 transition-colors"
            >
              {news.category}
            </Link>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {news.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{news.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{news.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{news.readTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{news.views.toLocaleString()} visualizações</span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Share2 className="h-4 w-4" />
                Compartilhar:
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
                  onClick={() => handleShare("facebook")}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
                  onClick={() => handleShare("linkedin")}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted"
                  onClick={() => handleShare("copy")}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {news.content.map((paragraph, index) => (
                <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
              <span className="text-sm font-medium text-foreground">Tags:</span>
              {news.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Share Again at Bottom */}
            <div className="flex items-center gap-3 mt-8 p-4 bg-muted/50 rounded-lg">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Share2 className="h-4 w-4" />
                Gostou? Compartilhe:
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
                  onClick={() => handleShare("facebook")}
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <AdBanner />

            {/* Related News */}
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">
                Notícias Relacionadas
              </h3>
              <div className="space-y-4">
                {relatedNews.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/noticia/${item.slug}`}
                    className="flex gap-3 group"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-16 object-cover rounded flex-shrink-0"
                    />
                    <div>
                      <span className="text-xs text-primary font-semibold">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Newsletter
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Receba as principais notícias diretamente no seu e-mail.
              </p>
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full px-3 py-2 rounded border border-border bg-background text-foreground mb-2"
              />
              <Button className="w-full">Inscrever-se</Button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NoticiaDetalhe;
