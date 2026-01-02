import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Filter, ArrowUpDown, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  slug: string;
  views: number | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

type SortOption = "date_desc" | "date_asc" | "popularity";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

const ITEMS_PER_PAGE = 9;

const Noticias = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, color")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const fetchNews = async (page: number, categoryId: string | null = null, sort: SortOption = "date_desc") => {
    setIsLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // Build query for count
      let countQuery = supabase
        .from("news")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      if (categoryId) {
        countQuery = countQuery.eq("category_id", categoryId);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Build query for data
      let dataQuery = supabase
        .from("news")
        .select(`
          id,
          title,
          excerpt,
          image_url,
          published_at,
          slug,
          views,
          category:categories(name, slug)
        `)
        .eq("is_published", true)
        .range(from, to);

      // Apply sorting
      if (sort === "date_desc") {
        dataQuery = dataQuery.order("published_at", { ascending: false });
      } else if (sort === "date_asc") {
        dataQuery = dataQuery.order("published_at", { ascending: true });
      } else if (sort === "popularity") {
        dataQuery = dataQuery.order("views", { ascending: false, nullsFirst: false });
      }

      if (categoryId) {
        dataQuery = dataQuery.eq("category_id", categoryId);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;

      setNews(data || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchNews(1, null, sortOption);
  }, []);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    fetchNews(1, categoryId, sortOption);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    fetchNews(1, selectedCategory, sort);
  };

  const handlePageChange = (page: number) => {
    fetchNews(page, selectedCategory, sortOption);
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

        {/* Filters and Sorting */}
        <section className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Category Filters */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filtrar por categoria:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(null)}
                  className="rounded-full"
                >
                  Todas
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(category.id)}
                    className="rounded-full"
                    style={
                      selectedCategory === category.id && category.color
                        ? { backgroundColor: category.color, borderColor: category.color }
                        : {}
                    }
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sorting Options */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortOption === "date_desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("date_desc")}
                  className="rounded-full"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Mais recentes
                </Button>
                <Button
                  variant={sortOption === "date_asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("date_asc")}
                  className="rounded-full"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Mais antigas
                </Button>
                <Button
                  variant={sortOption === "popularity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange("popularity")}
                  className="rounded-full"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Mais lidas
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-4">
          <AdBanner size="medium" />
        </section>

        <section className="container mx-auto px-4 pb-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando notícias...</span>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma notícia encontrada{selectedCategory ? " nesta categoria" : ""}.</p>
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

export default Noticias;
