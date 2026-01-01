import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const Busca = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchParams({ q: searchQuery });

    try {
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
        .limit(20);

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error("Erro na busca:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                  {results.length === 0
                    ? `Nenhum resultado encontrado para "${searchParams.get("q")}"`
                    : `${results.length} resultado${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""} para "${searchParams.get("q")}"`}
                </p>

                {results.length > 0 && (
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
