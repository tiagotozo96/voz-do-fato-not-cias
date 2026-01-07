import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { SEOHead } from "@/components/SEOHead";
import { ShareButtons } from "@/components/ShareButtons";
import { LazyImage } from "@/components/LazyImage";
import { NewsPoll } from "@/components/NewsPoll";
import { RelatedNews } from "@/components/RelatedNews";
import { Comments } from "@/components/Comments";
import { Calendar, Clock, User, ChevronRight, Loader2, Eye, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface NewsDetail {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  updated_at: string;
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

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const NoticiaDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async (newsId: string) => {
    const { data, error } = await supabase
      .from("comments")
      .select("id, author_name, content, created_at")
      .eq("news_id", newsId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  }, []);

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
          updated_at,
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

        // Fetch comments
        await fetchComments(data.id);
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
        <SEOHead title="Notícia não encontrada" />
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
      <SEOHead
        title={news.title}
        description={news.excerpt || undefined}
        image={news.image_url || undefined}
        type="article"
        publishedTime={news.published_at || undefined}
        modifiedTime={news.updated_at}
        author={news.author?.full_name || "Voz do Fato"}
        section={news.category?.name}
        tags={tags.map((t) => t.name)}
      />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          {news.category && (
            <>
              <Link to={`/categoria/${news.category.slug}`} className="hover:text-primary transition-colors">
                {news.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
          <span className="text-foreground line-clamp-1">{news.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2" itemScope itemType="https://schema.org/NewsArticle">
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight" itemProp="headline">
              {news.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              {news.author?.full_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span itemProp="author">{news.author.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time itemProp="datePublished" dateTime={news.published_at || ""}>
                  {formatDate(news.published_at)}
                </time>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{estimateReadTime(news.content)}</span>
              </div>
              {news.views && news.views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>{news.views.toLocaleString("pt-BR")} visualizações</span>
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <ShareButtons title={news.title} description={news.excerpt || ""} />
            </div>

            {/* Featured Image */}
            {news.image_url && (
              <figure className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                <LazyImage
                  src={news.image_url}
                  alt={news.title}
                  className="w-full h-full"
                  itemProp="image"
                />
              </figure>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none [&>p]:text-foreground/90 [&>p]:leading-relaxed [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>a]:text-primary [&>a]:underline [&>img]:max-w-full [&>img]:rounded-lg [&>img]:my-4"
              itemProp="articleBody"
              dangerouslySetInnerHTML={{ 
                __html: news.content || news.excerpt || '' 
              }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-border">
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Tag className="h-4 w-4" aria-hidden="true" />
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
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <ShareButtons title={news.title} description={news.excerpt || ""} variant="full" />
            </div>

            {/* Poll */}
            <div className="mt-8">
              <NewsPoll newsId={news.id} />
            </div>

            {/* Comments */}
            <div className="mt-8">
              <Comments
                newsId={news.id}
                comments={comments}
                onCommentAdded={() => fetchComments(news.id)}
              />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            <AdBanner />

            {/* Related News */}
            <RelatedNews
              newsId={news.id}
              categoryId={news.category_id}
              tags={tags.map((t) => t.id)}
            />

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
