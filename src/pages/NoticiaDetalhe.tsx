import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, ChevronRight, Loader2, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NewsDetail {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  views: number | null;
  slug: string;
  category_id: string | null;
  author: {
    full_name: string | null;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

interface RelatedNews {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

const NoticiaDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [relatedNews, setRelatedNews] = useState<RelatedNews[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNews = async () => {
    if (!slug) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .select(`
          id,
          title,
          excerpt,
          content,
          image_url,
          published_at,
          views,
          slug,
          category_id,
          author:profiles(full_name),
          category:categories(name, slug)
        `)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setNews(data);
        
        // Increment views
        await supabase.rpc("increment_news_views", { news_id: data.id });

        // Fetch tags for this news
        const { data: newsTags, error: tagsError } = await supabase
          .from("news_tags")
          .select(`
            tag:tags(id, name, slug)
          `)
          .eq("news_id", data.id);

        if (!tagsError && newsTags) {
          const tagsList = newsTags
            .map((nt: any) => nt.tag)
            .filter((t: any) => t !== null) as TagItem[];
          setTags(tagsList);
        }
        // Fetch related news from same category
        if (data.category_id) {
          const { data: related, error: relatedError } = await supabase
            .from("news")
            .select(`
              id,
              title,
              slug,
              image_url,
              category:categories(name, slug)
            `)
            .eq("is_published", true)
            .eq("category_id", data.category_id)
            .neq("id", data.id)
            .order("published_at", { ascending: false })
            .limit(4);

          if (!relatedError && related) {
            setRelatedNews(related);
          }
        }
        
        // If not enough related news from same category, fetch recent news
        if (relatedNews.length < 4) {
          const existingIds = [data.id, ...relatedNews.map(r => r.id)];
          const { data: moreNews, error: moreError } = await supabase
            .from("news")
            .select(`
              id,
              title,
              slug,
              image_url,
              category:categories(name, slug)
            `)
            .eq("is_published", true)
            .not("id", "in", `(${existingIds.join(",")})`)
            .order("published_at", { ascending: false })
            .limit(4 - relatedNews.length);

          if (!moreError && moreNews) {
            setRelatedNews(prev => [...prev, ...moreNews].slice(0, 4));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar notícia:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [slug]);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const estimateReadTime = (content: string | null) => {
    if (!content) return "2 min";
    const words = content.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando notícia...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          {news.category && (
            <>
              <Link to={`/categoria/${news.category.slug}`} className="hover:text-primary transition-colors">
                {news.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground line-clamp-1">{news.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Category Badge */}
            {news.category && (
              <Link 
                to={`/categoria/${news.category.slug}`}
                className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded mb-4 hover:bg-primary/90 transition-colors"
              >
                {news.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {news.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              {news.author?.full_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{news.author.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(news.published_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{estimateReadTime(news.content)}</span>
              </div>
              {news.views && news.views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{news.views.toLocaleString("pt-BR")} visualizações</span>
                </div>
              )}
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
            {news.image_url && (
              <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {news.content ? (
                news.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))
              ) : news.excerpt ? (
                <p className="text-foreground/90 leading-relaxed mb-4">{news.excerpt}</p>
              ) : null}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Tag className="h-4 w-4" />
                  Tags:
                </span>
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/tag/${tag.slug}`}
                    className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

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
            {relatedNews.length > 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">
                  Notícias Relacionadas
                </h3>
                <div className="space-y-4">
                  {relatedNews.map((item) => (
                    <Link
                      key={item.id}
                      to={`/noticia/${item.slug}`}
                      className="flex gap-3 group"
                    >
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.title}
                        className="w-20 h-16 object-cover rounded flex-shrink-0"
                      />
                      <div>
                        {item.category && (
                          <span className="text-xs text-primary font-semibold">
                            {item.category.name}
                          </span>
                        )}
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
