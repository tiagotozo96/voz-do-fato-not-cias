import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper } from 'lucide-react';

interface RelatedNews {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

interface RelatedNewsProps {
  newsId: string;
  categoryId: string | null;
  tags?: string[];
  limit?: number;
}

export function RelatedNews({ newsId, categoryId, tags = [], limit = 4 }: RelatedNewsProps) {
  const [relatedNews, setRelatedNews] = useState<RelatedNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedNews = async () => {
      try {
        let newsIds: string[] = [];

        // First try to get news with same tags
        if (tags.length > 0) {
          const { data: taggedNews } = await supabase
            .from('news_tags')
            .select('news_id')
            .in('tag_id', tags)
            .neq('news_id', newsId)
            .limit(limit * 2);

          if (taggedNews) {
            newsIds = [...new Set(taggedNews.map((t) => t.news_id))];
          }
        }

        // If not enough, get from same category
        if (newsIds.length < limit && categoryId) {
          const { data: categoryNews } = await supabase
            .from('news')
            .select('id')
            .eq('category_id', categoryId)
            .eq('is_published', true)
            .neq('id', newsId)
            .not('id', 'in', `(${newsIds.length > 0 ? newsIds.join(',') : newsId})`)
            .order('published_at', { ascending: false })
            .limit(limit - newsIds.length);

          if (categoryNews) {
            newsIds = [...newsIds, ...categoryNews.map((n) => n.id)];
          }
        }

        // If still not enough, get recent news
        if (newsIds.length < limit) {
          const { data: recentNews } = await supabase
            .from('news')
            .select('id')
            .eq('is_published', true)
            .neq('id', newsId)
            .not('id', 'in', `(${newsIds.length > 0 ? newsIds.join(',') : newsId})`)
            .order('published_at', { ascending: false })
            .limit(limit - newsIds.length);

          if (recentNews) {
            newsIds = [...newsIds, ...recentNews.map((n) => n.id)];
          }
        }

        if (newsIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch full news data
        const { data, error } = await supabase
          .from('news')
          .select(`
            id,
            title,
            slug,
            image_url,
            published_at,
            category:categories(name, slug)
          `)
          .in('id', newsIds.slice(0, limit))
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) throw error;
        setRelatedNews(data || []);
      } catch (error) {
        console.error('Error fetching related news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedNews();
  }, [newsId, categoryId, tags, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Notícias Relacionadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-20 h-14 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (relatedNews.length === 0) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          Notícias Relacionadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relatedNews.map((news) => (
          <Link
            key={news.id}
            to={`/noticia/${news.slug}`}
            className="flex gap-3 group hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            {news.image_url ? (
              <img
                src={news.image_url}
                alt={news.title}
                className="w-20 h-14 object-cover rounded flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                <Newspaper className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {news.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {news.category && (
                  <span className="text-primary">{news.category.name}</span>
                )}
                <span>•</span>
                <span>{formatDate(news.published_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
