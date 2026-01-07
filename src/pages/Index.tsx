import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CategoryCircle } from "@/components/CategoryCircle";
import { NewsCard } from "@/components/NewsCard";
import { AdBanner } from "@/components/AdBanner";
import { SEOHead } from "@/components/SEOHead";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";
import { Skeleton } from "@/components/ui/skeleton";

import catBrasil from "@/assets/cat-brasil.jpg";
import catMundo from "@/assets/cat-mundo.jpg";
import catTech from "@/assets/cat-tech.jpg";
import catEconomia from "@/assets/cat-economia.jpg";
import catEsportes from "@/assets/cat-esportes.jpg";
import catEntretenimento from "@/assets/cat-entretenimento.jpg";
import catPolicia from "@/assets/cat-policia.jpg";

const Index = () => {
  const { news: allNews, isLoading } = useRealtimeNews({ limit: 20 });

  const categories = [
    { name: "Brasil", icon: catBrasil, slug: "brasil" },
    { name: "Polícia", icon: catPolicia, slug: "policia" },
    { name: "Tecnologia", icon: catTech, slug: "tecnologia" },
    { name: "Economia", icon: catEconomia, slug: "economia" },
    { name: "Esportes", icon: catEsportes, slug: "esportes" },
    { name: "Entretenimento", icon: catEntretenimento, slug: "entretenimento" },
  ];

  // Get featured news (first featured or first news)
  const featuredNews = allNews.find((n) => n.is_featured) || allNews[0];
  
  // Get police news
  const policeNews = allNews
    .filter((n) => n.category?.slug === 'policia' && n.id !== featuredNews?.id)
    .slice(0, 4);
  
  // Get recent news (excluding featured and police)
  const recentNews = allNews
    .filter(
      (n) =>
        n.id !== featuredNews?.id &&
        !policeNews.some((p) => p.id === n.id)
    )
    .slice(0, 6);

  // Get highlights (last 2 from remaining)
  const highlightNews = allNews
    .filter(
      (n) =>
        n.id !== featuredNews?.id &&
        !policeNews.some((p) => p.id === n.id) &&
        !recentNews.some((r) => r.id === n.id)
    )
    .slice(0, 2);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const NewsCardSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead />
      <Header />

      <main className="flex-1">
        {/* Top Ad Banner */}
        <section className="container mx-auto px-4 py-4">
          <AdBanner size="large" />
        </section>

        {/* Categories Section */}
        <section className="bg-muted py-8 border-y border-border" aria-label="Categorias">
          <div className="container mx-auto px-4">
            <div className="flex gap-8 overflow-x-auto pb-4 justify-center scrollbar-hide">
              {categories.map((category) => (
                <CategoryCircle
                  key={category.name}
                  name={category.name}
                  icon={category.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured News */}
        <section className="container mx-auto px-4 py-12" aria-label="Notícia em destaque">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : featuredNews ? (
            <NewsCard
              title={featuredNews.title}
              description={featuredNews.excerpt || ''}
              image={featuredNews.image_url || ''}
              category={featuredNews.category?.name?.toUpperCase() || ''}
              date={`${formatDate(featuredNews.published_at)} - ${featuredNews.category?.name || ''}`}
              slug={featuredNews.slug}
              featured={true}
            />
          ) : (
            <p className="text-center text-muted-foreground">Nenhuma notícia em destaque disponível.</p>
          )}
        </section>

        {/* Police News Section - Highlighted */}
        <section className="bg-gradient-to-r from-red-950/20 to-red-900/10 py-12 border-y-4 border-primary" aria-label="Notícias policiais">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-md">POLÍCIA</span>
                Notícias Policiais em Destaque
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <>
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                </>
              ) : policeNews.length > 0 ? (
                policeNews.map((news) => (
                  <NewsCard
                    key={news.id}
                    title={news.title}
                    description={news.excerpt || ''}
                    image={news.image_url || ''}
                    category={news.category?.name?.toUpperCase() || 'POLÍCIA'}
                    date={formatDate(news.published_at)}
                    slug={news.slug}
                  />
                ))
              ) : (
                <p className="col-span-4 text-center text-muted-foreground">
                  Nenhuma notícia policial disponível.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Mid Ad Banner */}
        <section className="container mx-auto px-4 py-8">
          <AdBanner size="medium" />
        </section>

        {/* Recent News Grid */}
        <section className="container mx-auto px-4 pb-12" aria-label="Últimas notícias">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
              Últimas Notícias
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
                <NewsCardSkeleton />
              </>
            ) : recentNews.length > 0 ? (
              recentNews.map((news) => (
                <NewsCard
                  key={news.id}
                  title={news.title}
                  description={news.excerpt || ''}
                  image={news.image_url || ''}
                  category={news.category?.name?.toUpperCase() || ''}
                  date={formatDate(news.published_at)}
                  slug={news.slug}
                />
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">
                Nenhuma notícia recente disponível.
              </p>
            )}
          </div>
        </section>

        {/* Bottom Ad Banner */}
        <section className="container mx-auto px-4 py-8">
          <AdBanner size="large" />
        </section>

        {/* More News Section */}
        <section className="bg-muted py-12" aria-label="Destaques da semana">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold border-l-4 border-primary pl-4">
                Destaques da Semana
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading ? (
                <>
                  <NewsCardSkeleton />
                  <NewsCardSkeleton />
                </>
              ) : highlightNews.length > 0 ? (
                highlightNews.map((news) => (
                  <NewsCard
                    key={news.id}
                    title={news.title}
                    description={news.excerpt || ''}
                    image={news.image_url || ''}
                    category={news.category?.name?.toUpperCase() || ''}
                    date={formatDate(news.published_at)}
                    slug={news.slug}
                  />
                ))
              ) : (
                <p className="col-span-2 text-center text-muted-foreground">
                  Nenhum destaque disponível.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
