import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, PieChartIcon, BarChart3, Calendar, Eye, Loader2, Users, Mail, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NewsItem {
  id: string;
  title: string;
  views: number | null;
  published_at: string;
  created_at: string;
  is_published: boolean;
  categories: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface ViewsHistory {
  news_id: string;
  view_date: string;
  view_count: number;
}

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  is_confirmed: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface DashboardChartsProps {
  news: NewsItem[];
  categories: Category[];
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export const DashboardCharts = ({ news, categories }: DashboardChartsProps) => {
  const [viewsHistory, setViewsHistory] = useState<ViewsHistory[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetchViewsHistory();
    fetchSubscribers();
  }, [period]);

  const fetchViewsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const daysAgo = period === '7d' ? 7 : 30;
      const startDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('news_views_history')
        .select('news_id, view_date, view_count')
        .gte('view_date', startDate)
        .order('view_date', { ascending: true });

      if (error) throw error;
      setViewsHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, is_active, is_confirmed, subscribed_at, unsubscribed_at')
        .order('subscribed_at', { ascending: true });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Erro ao carregar assinantes:', error);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // Views per day from history
  const viewsPerDay = useMemo(() => {
    const daysCount = period === '7d' ? 7 : 30;
    const days = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayViews = viewsHistory
        .filter(v => v.view_date === dateStr)
        .reduce((sum, v) => sum + v.view_count, 0);
      
      days.push({
        date: format(date, period === '7d' ? 'EEE' : 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        visualizações: dayViews
      });
    }
    return days;
  }, [viewsHistory, period]);

  // Publications per day
  const publicationsPerDay = useMemo(() => {
    const daysCount = period === '7d' ? 7 : 30;
    const days = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const count = news.filter(n => {
        if (!n.published_at) return false;
        const pubDate = parseISO(n.published_at);
        return pubDate >= date && pubDate < nextDate;
      }).length;
      
      days.push({
        date: format(date, period === '7d' ? 'EEE' : 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM', { locale: ptBR }),
        publicações: count
      });
    }
    return days;
  }, [news, period]);

  // Subscribers growth per day (cumulative)
  const subscribersGrowth = useMemo(() => {
    const daysCount = period === '7d' ? 7 : 30;
    const days = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count total subscribers up to this date
      const totalActive = subscribers.filter(s => {
        const subscribedDate = format(parseISO(s.subscribed_at), 'yyyy-MM-dd');
        const wasSubscribedByDate = subscribedDate <= dateStr;
        const isStillActive = s.is_active && s.is_confirmed && 
          (!s.unsubscribed_at || format(parseISO(s.unsubscribed_at), 'yyyy-MM-dd') > dateStr);
        return wasSubscribedByDate && isStillActive;
      }).length;

      // New subscribers on this specific day
      const newOnDay = subscribers.filter(s => {
        const subscribedDate = format(parseISO(s.subscribed_at), 'yyyy-MM-dd');
        return subscribedDate === dateStr;
      }).length;
      
      days.push({
        date: format(date, period === '7d' ? 'EEE' : 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        total: totalActive,
        novos: newOnDay
      });
    }
    return days;
  }, [subscribers, period]);

  // Subscriber stats
  const subscriberStats = useMemo(() => {
    const activeConfirmed = subscribers.filter(s => s.is_active && s.is_confirmed).length;
    const pending = subscribers.filter(s => !s.is_confirmed && s.is_active).length;
    const unsubscribed = subscribers.filter(s => !s.is_active || s.unsubscribed_at).length;
    
    const daysAgo = period === '7d' ? 7 : 30;
    const startDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
    const newInPeriod = subscribers.filter(s => {
      const subscribedDate = format(parseISO(s.subscribed_at), 'yyyy-MM-dd');
      return subscribedDate >= startDate;
    }).length;

    // Calculate growth rate
    const previousPeriodStart = format(subDays(new Date(), daysAgo * 2), 'yyyy-MM-dd');
    const previousPeriodEnd = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
    const newInPreviousPeriod = subscribers.filter(s => {
      const subscribedDate = format(parseISO(s.subscribed_at), 'yyyy-MM-dd');
      return subscribedDate >= previousPeriodStart && subscribedDate < previousPeriodEnd;
    }).length;

    const growthRate = newInPreviousPeriod > 0 
      ? ((newInPeriod - newInPreviousPeriod) / newInPreviousPeriod * 100).toFixed(1)
      : newInPeriod > 0 ? '100' : '0';

    return { activeConfirmed, pending, unsubscribed, newInPeriod, growthRate: parseFloat(growthRate) };
  }, [subscribers, period]);

  // Views by category
  const viewsByCategory = useMemo(() => {
    const categoryViews: Record<string, { name: string; views: number; color: string }> = {};
    
    news.forEach(n => {
      if (n.categories && n.views) {
        const catId = n.categories.id;
        if (!categoryViews[catId]) {
          categoryViews[catId] = {
            name: n.categories.name,
            views: 0,
            color: n.categories.color || COLORS[Object.keys(categoryViews).length % COLORS.length]
          };
        }
        categoryViews[catId].views += n.views;
      }
    });
    
    return Object.values(categoryViews)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [news]);

  // Top 5 most viewed news
  const topViewedNews = useMemo(() => {
    return [...news]
      .filter(n => n.is_published && n.views && n.views > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(n => ({
        title: n.title.length > 30 ? n.title.substring(0, 30) + '...' : n.title,
        fullTitle: n.title,
        views: n.views || 0
      }));
  }, [news]);

  // Total views in period
  const totalViewsInPeriod = useMemo(() => {
    return viewsHistory.reduce((sum, v) => sum + v.view_count, 0);
  }, [viewsHistory]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{payload[0]?.payload?.fullDate || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('pt-BR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value.toLocaleString('pt-BR')} visualizações
          </p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-medium text-foreground text-sm">{payload[0]?.payload?.fullTitle}</p>
          <p className="text-sm text-primary">
            {payload[0].value.toLocaleString('pt-BR')} visualizações
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analytics
        </h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d')}>
          <TabsList>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views no Período</p>
                <p className="text-2xl font-bold text-primary">
                  {isLoadingHistory ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    totalViewsInPeriod.toLocaleString('pt-BR')
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média Diária</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingHistory ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    Math.round(totalViewsInPeriod / (period === '7d' ? 7 : 30)).toLocaleString('pt-BR')
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assinantes Ativos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoadingSubscribers ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    subscriberStats.activeConfirmed.toLocaleString('pt-BR')
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Novos Assinantes</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {isLoadingSubscribers ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `+${subscriberStats.newInPeriod}`
                    )}
                  </p>
                  {!isLoadingSubscribers && subscriberStats.growthRate !== 0 && (
                    <span className={`text-xs flex items-center ${subscriberStats.growthRate > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {subscriberStats.growthRate > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(subscriberStats.growthRate)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publication stats card */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Publicações no Período</p>
                <p className="text-xl font-bold text-amber-600">
                  {publicationsPerDay.reduce((sum, d) => sum + d.publicações, 0)} notícias
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* First row - Time-based charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              Visualizações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsPerDay}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={period === '30d' ? 4 : 0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="visualizações" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorViews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Publications per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Publicações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={publicationsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    interval={period === '30d' ? 4 : 0}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="publicações" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row - Category and top news charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by category - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Visualizações por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {viewsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viewsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="views"
                      nameKey="name"
                    >
                      {viewsByCategory.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma visualização registrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top viewed news */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top 5 Notícias Mais Vistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {topViewedNews.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topViewedNews} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      type="category"
                      dataKey="title" 
                      tick={{ fontSize: 11 }}
                      width={120}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar 
                      dataKey="views" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma notícia com visualizações
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third row - Subscribers Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscribers growth chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Crescimento de Assinantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoadingSubscribers ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subscribersGrowth}>
                    <defs>
                      <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={period === '30d' ? 4 : 0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Total Assinantes"
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fill="url(#colorSubscribers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* New subscribers per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              Novos Assinantes por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoadingSubscribers ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscribersGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={period === '30d' ? 4 : 0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="novos" 
                      name="Novos Assinantes"
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};