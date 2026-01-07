import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Tag as TagIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  slug: string;
  category: {
    name: string;
    slug: string;
  } | null;
}

interface TagInfo {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 9;

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsIds, setNewsIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchTagAndNews = useCallback(async (page: number) => {
    if (!slug) return;
    
    setIsLoading(true);
    try {
      // Fetch tag info
      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (tagError) throw tagError;
      if (!tagData) {
        setTag(null);
        setNews([]);
        setIsLoading(false);
        return;
      }

      setTag(tagData);

      // Count news with this tag
      const { count } = await supabase
        .from("news_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tagData.id);

      setTotalCount(count || 0);

      // Fetch news IDs for this tag
      const from = (page - 1) * ITEMS_PER_PAGE;
      const { data: newsTagsData, error: newsTagsError } = await supabase
        .from("news_tags")
        .select("news_id")
        .eq("tag_id", tagData.id)
        .range(from, from + ITEMS_PER_PAGE - 1);

      if (newsTagsError) throw newsTagsError;

      if (newsTagsData && newsTagsData.length > 0) {
        const ids = newsTagsData.map((nt) => nt.news_id);
        setNewsIds(ids);

        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select(`
            id,
            title,
            excerpt,
            image_url,
            published_at,
            slug,
            category:categories(name, slug)
          `)
          .in("id", ids)
          .eq("is_published", true)
          .order("published_at", { ascending: false });

        if (newsError) throw newsError;
        setNews(newsData || []);
      } else {
        setNewsIds([]);
        setNews([]);
      }

      setCurrentPage(page);
    } catch (error) {
      console.error("Erro ao carregar tag:", error);
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchTagAndNews(1);
  }, [slug, fetchTagAndNews]);

  // Realtime subscription
  useEffect(() => {
    if (!tag) return;

    const channel = supabase
      .channel(`tag-${tag.id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any;
            
            // Check if this news is in our current list
            if (newsIds.includes(updatedRecord.id)) {
              if (updatedRecord.is_published) {
                const { data } = await supabase
                  .from('news')
                  .select(`
                    id, title, excerpt, image_url, published_at, slug,
                    category:categories(name, slug)
                  `)
                  .eq('id', updatedRecord.id)
                  .single();

                if (data) {
                  setNews((prev) =>
                    prev.map((item) => (item.id === data.id ? data : item))
                  );
                }
              } else {
                // Unpublished - remove from list
                setNews((prev) => prev.filter((item) => item.id !== updatedRecord.id));
              }
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedRecord = payload.old as any;
            if (newsIds.includes(deletedRecord.id)) {
              setNews((prev) => prev.filter((item) => item.id !== deletedRecord.id));
              setTotalCount((c) => Math.max(0, c - 1));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_tags',
        },
        async (payload) => {
          const newRecord = payload.new as any;
          
          if (newRecord.tag_id === tag.id) {
            // New news added to this tag
            const { data } = await supabase
              .from('news')
              .select(`
                id, title, excerpt, image_url, published_at, slug,
                category:categories(name, slug)
              `)
              .eq('id', newRecord.news_id)
              .eq('is_published', true)
              .maybeSingle();

            if (data) {
              setNews((prev) => [data, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
              setNewsIds((prev) => [data.id, ...prev]);
              setTotalCount((c) => c + 1);
              toast({
                title: '📰 Nova notícia!',
                description: data.title,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'news_tags',
        },
        (payload) => {
          const deletedRecord = payload.old as any;
          
          if (deletedRecord.tag_id === tag.id) {
            setNews((prev) => prev.filter((item) => item.id !== deletedRecord.news_id));
            setNewsIds((prev) => prev.filter((id) => id !== deletedRecord.news_id));
            setTotalCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tag, newsIds, toast]);

  const handlePageChange = (page: number) => {
    fetchTagAndNews(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (showEllipsisStart) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (showEllipsisEnd) {
      if (currentPage < totalPages - 3) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((page, idx) =>
          typeof page === "string" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="Tag não encontrada" />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Tag não encontrada</h1>
            <p className="text-muted-foreground mb-6">A tag que você procura não existe.</p>
            <Link to="/noticias">
              <Button>Ver todas as notícias</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={`${tag.name} - Portal de Notícias`}
        description={`Notícias relacionadas à tag ${tag.name}`}
      />
      <Header />

      <main className="flex-1">
        <section className="bg-muted py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <TagIcon className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-display font-bold">
                {tag.name}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Notícias relacionadas à tag "{tag.name}"
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-4">
          <AdBanner size="medium" />
        </section>

        <section className="container mx-auto px-4 pb-12">
          {news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma notícia encontrada com esta tag.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {totalCount} notícia{totalCount !== 1 ? "s" : ""} encontrada{totalCount !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                  <NewsCard
                    key={item.id}
                    title={item.title}
                    description={item.excerpt || ""}
                    image={item.image_url || "/placeholder.svg"}
                    category={item.category?.name || "Geral"}
                    date={formatDate(item.published_at)}
                    slug={item.slug}
                  />
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TagPage;
