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

// Placeholder news data
const newsData: Record<string, {
  title: string;
  category: string;
  categorySlug: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  image: string;
  content: string[];
  tags: string[];
}> = {
  "governo-anuncia-novo-pacote-economico": {
    title: "Governo anuncia novo pacote de medidas econômicas para 2025",
    category: "Brasil",
    categorySlug: "brasil",
    author: "João Silva",
    date: "30 de Dezembro, 2024",
    readTime: "5 min de leitura",
    views: 1250,
    image: brasilNews,
    content: [
      "O governo federal anunciou nesta segunda-feira um novo pacote de medidas econômicas que promete impulsionar o crescimento do país em 2025. As medidas incluem incentivos fiscais para pequenas e médias empresas, além de investimentos em infraestrutura.",
      "Segundo o ministro da Economia, as novas políticas devem gerar mais de 500 mil empregos nos próximos dois anos. 'Estamos focados em criar um ambiente favorável para o empreendedorismo e a geração de renda', afirmou em coletiva de imprensa.",
      "Entre as principais medidas anunciadas estão: redução de impostos para setores estratégicos, linha de crédito especial para micro e pequenas empresas, programa de capacitação profissional e investimentos em tecnologia e inovação.",
      "Especialistas avaliam que o pacote pode ter impacto significativo na recuperação econômica do país. 'As medidas são bem direcionadas e atendem demandas históricas do setor produtivo', comentou o economista Carlos Mendes.",
      "A implementação das medidas deve começar no primeiro trimestre de 2025, com resultados esperados já no segundo semestre do próximo ano.",
    ],
    tags: ["Economia", "Governo", "Investimentos", "Empregos"],
  },
  "operacao-policial-prende-quadrilha": {
    title: "Operação policial prende quadrilha especializada em roubo de cargas",
    category: "Polícia",
    categorySlug: "policia",
    author: "Maria Santos",
    date: "29 de Dezembro, 2024",
    readTime: "4 min de leitura",
    views: 890,
    image: policiaNews1,
    content: [
      "Uma operação conjunta entre as polícias Civil e Federal resultou na prisão de 12 integrantes de uma quadrilha especializada em roubo de cargas na região metropolitana.",
      "A organização criminosa atuava há mais de dois anos e era responsável por prejuízos estimados em R$ 15 milhões. Os criminosos utilizavam veículos clonados e tinham informantes em empresas de logística.",
      "Durante a operação, foram apreendidos veículos, armas de fogo e mercadorias roubadas avaliadas em R$ 2 milhões. Os presos serão indiciados por associação criminosa, roubo qualificado e receptação.",
    ],
    tags: ["Polícia", "Operação", "Segurança", "Crime"],
  },
};

// Related news placeholder
const relatedNews = [
  {
    slug: "economia-brasileira-cresce",
    title: "Economia brasileira cresce acima das expectativas no terceiro trimestre",
    image: policiaNews2,
    category: "Economia",
  },
  {
    slug: "nova-politica-industrial",
    title: "Nova política industrial promete modernizar setor produtivo",
    image: brasilNews,
    category: "Brasil",
  },
];

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
