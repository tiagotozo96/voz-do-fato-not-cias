import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  slug: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

const colorMap: Record<string, string> = {
  brasil: "from-green-950/20 to-green-900/10",
  policia: "from-red-950/20 to-red-900/10",
  tecnologia: "from-blue-950/20 to-blue-900/10",
  economia: "from-yellow-950/20 to-yellow-900/10",
  esportes: "from-emerald-950/20 to-emerald-900/10",
  entretenimento: "from-purple-950/20 to-purple-900/10",
  mundo: "from-cyan-950/20 to-cyan-900/10",
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const fetchCategoryAndNews = async () => {
      if (!slug) return;

      setIsLoading(true);

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .eq('slug', slug)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        setIsLoading(false);
        return;
      }

      setCategory(categoryData);

      // Fetch news for this category
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('id, title, excerpt, image_url, published_at, slug')
        .eq('category_id', categoryData.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(20);

      if (newsError) {
        console.error('Error fetching news:', newsError);
      } else {
        setNews(newsData || []);
      }

      setIsLoading(false);
    };

    fetchCategoryAndNews();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`category-${slug}-news`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        async (payload) => {
          if (!category) return;

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            
            if (newRecord.is_published && newRecord.category_id === category.id) {
              const { data } = await supabase
                .from('news')
                .select('id, title, excerpt, image_url, published_at, slug')
                .eq('id', newRecord.id)
                .single();

              if (data) {
                setNews((prev) => [data, ...prev.slice(0, 19)]);
                toast({
                  title: '📰 Nova notícia!',
                  description: data.title,
                });
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any;
            
            if (updatedRecord.is_published && updatedRecord.category_id === category.id) {
              const { data } = await supabase
                .from('news')
                .select('id, title, excerpt, image_url, published_at, slug')
                .eq('id', updatedRecord.id)
                .single();

              if (data) {
                setNews((prev) => {
                  const exists = prev.some((item) => item.id === data.id);
                  if (exists) {
                    return prev.map((item) => (item.id === data.id ? data : item));
                  } else {
                    return [data, ...prev.slice(0, 19)];
                  }
                });
              }
            } else {
              // Remove if unpublished or changed category
              setNews((prev) => prev.filter((item) => item.id !== updatedRecord.id));
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedRecord = payload.old as any;
            setNews((prev) => prev.filter((item) => item.id !== deletedRecord.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, category?.id, toast]);

  const gradientColor = colorMap[slug || ''] || 'from-gray-950/20 to-gray-900/10';

  const NewsCardSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  const featuredNews = news.slice(0, 4);
  const moreNews = news.slice(4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={category ? `${category.name} - Portal de Notícias` : 'Categoria'}
        description={category ? `Últimas notícias de ${category.name}` : ''}
      />
      <Header />

      <main className="flex-1">
        <section className={`bg-gradient-to-r ${gradientColor} py-12 border-y-4 border-primary`}>
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold border-l-4 border-primary pl-4 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-md">
                  {category?.name?.toUpperCase() || 'CATEGORIA'}
                </span>
                Últimas Notícias
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <>
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                </>
              ) : featuredNews.length > 0 ? (
                featuredNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    title={item.title}
                    description={item.excerpt || ''}
                    image={item.image_url || ''}
                    category={category?.name?.toUpperCase() || ''}
                    date={formatDate(item.published_at)}
                    slug={item.slug}
                  />
                ))
              ) : (
                <p className="col-span-4 text-center text-muted-foreground py-8">
                  Nenhuma notícia disponível nesta categoria.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>

        {moreNews.length > 0 && (
          <section className="container mx-auto px-4 pb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
                Mais Notícias de {category?.name}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moreNews.map((item) => (
                <NewsCard
                  key={item.id}
                  title={item.title}
                  description={item.excerpt || ''}
                  image={item.image_url || ''}
                  category={category?.name?.toUpperCase() || ''}
                  date={formatDate(item.published_at)}
                  slug={item.slug}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Category;
