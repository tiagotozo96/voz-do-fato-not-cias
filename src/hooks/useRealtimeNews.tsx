import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  slug: string;
  is_featured: boolean | null;
  category: {
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

interface UseRealtimeNewsOptions {
  limit?: number;
  categorySlug?: string;
  showNotifications?: boolean;
}

export function useRealtimeNews(options: UseRealtimeNewsOptions = {}) {
  const { limit = 10, categorySlug, showNotifications = true } = options;
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNews = useCallback(async () => {
    try {
      let query = supabase
        .from('news')
        .select(`
          id,
          title,
          excerpt,
          image_url,
          published_at,
          slug,
          is_featured,
          category:categories(name, slug, color)
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, categorySlug]);

  useEffect(() => {
    fetchNews();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('news-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news',
        },
        async (payload) => {
          console.log('Realtime news update:', payload);

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any;
            
            // Only show if published
            if (newRecord.is_published) {
              // Fetch the complete news item with category
              const { data } = await supabase
                .from('news')
                .select(`
                  id,
                  title,
                  excerpt,
                  image_url,
                  published_at,
                  slug,
                  is_featured,
                  category:categories(name, slug, color)
                `)
                .eq('id', newRecord.id)
                .single();

              if (data) {
                setNews((prev) => [data, ...prev.slice(0, limit - 1)]);
                
                if (showNotifications) {
                  toast({
                    title: '📰 Nova notícia!',
                    description: data.title,
                  });
                }
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as any;
            
            if (updatedRecord.is_published) {
              // Fetch the complete updated news item
              const { data } = await supabase
                .from('news')
                .select(`
                  id,
                  title,
                  excerpt,
                  image_url,
                  published_at,
                  slug,
                  is_featured,
                  category:categories(name, slug, color)
                `)
                .eq('id', updatedRecord.id)
                .single();

              if (data) {
                setNews((prev) => {
                  const exists = prev.some((item) => item.id === data.id);
                  if (exists) {
                    return prev.map((item) =>
                      item.id === data.id ? data : item
                    );
                  } else {
                    // Was unpublished, now published
                    return [data, ...prev.slice(0, limit - 1)];
                  }
                });
              }
            } else {
              // Was published, now unpublished - remove from list
              setNews((prev) =>
                prev.filter((item) => item.id !== updatedRecord.id)
              );
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedRecord = payload.old as any;
            setNews((prev) =>
              prev.filter((item) => item.id !== deletedRecord.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNews, limit, showNotifications, toast]);

  return { news, isLoading, refetch: fetchNews };
}
