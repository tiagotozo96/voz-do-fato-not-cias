import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

const ITEMS_PER_PAGE = 9;

const Busca = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setActiveQuery(searchQuery);
    setSearchParams({ q: searchQuery, page: page.toString() });

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // Get total count
      const { count } = await supabase
        .from("news")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);

      setTotalCount(count || 0);

      // Get paginated results
      const { data, error } = await supabase
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
        .eq("is_published", true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setResults(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erro na busca:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    const initialPage = parseInt(searchParams.get("page") || "1");
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery, initialPage);
    }
  }, []);

  // Realtime subscription for search results
  useEffect(() => {
    if (!activeQuery) return;

    const channel = supabase
      .channel('search-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        async (payload) => {
          const checkMatch = (record: any) => {
            const q = activeQuery.toLowerCase();
            return (
              record.title?.toLowerCase().includes(q) ||
              record.content?.toLowerCase().includes(q) ||
              record.excerpt?.toLowerCase().includes(q)
            );
          };

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            
            if (newRecord.is_published && checkMatch(newRecord)) {
              const { data } = await supabase
                .from('news')
                .select(`
                  id, title, excerpt, image_url, published_at, slug,
                  category:categories(name, slug)
                `)
                .eq('id', newRecord.id)
                .single();

              if (data) {
                setResults((prev) => [data, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
                setTotalCount((prev) => prev + 1);
                toast({
                  title: '📰 Novo resultado!',
                  description: data.title,
                });
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any;
            const matches = updatedRecord.is_published && checkMatch(updatedRecord);
            
            if (matches) {
              const { data } = await supabase
                .from('news')
                .select(`
                  id, title, excerpt, image_url, published_at, slug,
                  category:categories(name, slug)
                `)
                .eq('id', updatedRecord.id)
                .single();

              if (data) {
                setResults((prev) => {
                  const exists = prev.some((item) => item.id === data.id);
                  if (exists) {
                    return prev.map((item) => (item.id === data.id ? data : item));
                  }
                  return [data, ...prev.slice(0, ITEMS_PER_PAGE - 1)];
                });
              }
            } else {
              setResults((prev) => prev.filter((item) => item.id !== updatedRecord.id));
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedRecord = payload.old as any;
            setResults((prev) => {
              const hadItem = prev.some((item) => item.id === deletedRecord.id);
              if (hadItem) {
                setTotalCount((c) => Math.max(0, c - 1));
              }
              return prev.filter((item) => item.id !== deletedRecord.id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeQuery, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, 1);
  };

  const handlePageChange = (page: number) => {
    handleSearch(query, page);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={activeQuery ? `Busca: ${activeQuery} - Portal de Notícias` : 'Buscar Notícias'}
        description="Busque notícias no nosso portal"
      />
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-6 text-center">
              Buscar Notícias
            </h1>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Digite sua busca..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pr-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                <span className="ml-2 hidden sm:inline">Buscar</span>
              </Button>
            </form>
          </div>

          <AdBanner size="medium" />

          {/* Results */}
          <div className="mt-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Buscando...</span>
              </div>
            ) : hasSearched ? (
              <>
                <p className="text-muted-foreground mb-6">
                  {totalCount === 0
                    ? `Nenhum resultado encontrado para "${searchParams.get("q")}"`
                    : `${totalCount} resultado${totalCount !== 1 ? "s" : ""} encontrado${totalCount !== 1 ? "s" : ""} para "${searchParams.get("q")}"`}
                </p>

                {results.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.map((news) => (
                        <NewsCard
                          key={news.id}
                          title={news.title}
                          description={news.excerpt || ""}
                          image={news.image_url || "/placeholder.svg"}
                          category={news.category?.name || "Geral"}
                          date={formatDate(news.published_at)}
                          slug={news.slug}
                        />
                      ))}
                    </div>
                    {renderPagination()}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digite um termo para buscar notícias</p>
              </div>
            )}
          </div>

          <AdBanner size="medium" className="mt-8" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Busca;
