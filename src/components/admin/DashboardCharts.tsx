import { useMemo } from 'react';
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfDay, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, PieChartIcon, BarChart3, Calendar } from 'lucide-react';

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

interface DashboardChartsProps {
  news: NewsItem[];
  categories: Category[];
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export const DashboardCharts = ({ news, categories }: DashboardChartsProps) => {
  // Publications per day (last 7 days)
  const publicationsPerDay = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const count = news.filter(n => {
        if (!n.published_at) return false;
        const pubDate = parseISO(n.published_at);
        return pubDate >= date && pubDate < nextDate;
      }).length;
      
      days.push({
        date: format(date, 'EEE', { locale: ptBR }),
        fullDate: format(date, 'dd/MM', { locale: ptBR }),
        publicações: count
      });
    }
    return days;
  }, [news]);

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

  // Publications per week (last 4 weeks)
  const publicationsPerWeek = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfDay(subDays(new Date(), (i + 1) * 7));
      const weekEnd = startOfDay(subDays(new Date(), i * 7));
      
      const count = news.filter(n => {
        if (!n.published_at) return false;
        const pubDate = parseISO(n.published_at);
        return pubDate >= weekStart && pubDate < weekEnd;
      }).length;
      
      const totalViews = news
        .filter(n => {
          if (!n.published_at) return false;
          const pubDate = parseISO(n.published_at);
          return pubDate >= weekStart && pubDate < weekEnd;
        })
        .reduce((sum, n) => sum + (n.views || 0), 0);
      
      weeks.push({
        week: `Sem ${4 - i}`,
        period: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
        publicações: count,
        views: totalViews
      });
    }
    return weeks;
  }, [news]);

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
      {/* First row - Publications charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publications per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Publicações por Dia (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={publicationsPerDay}>
                  <defs>
                    <linearGradient id="colorPub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="publicações" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorPub)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Publications per week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Publicações por Semana (Últimas 4 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={publicationsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="font-medium text-foreground">{payload[0]?.payload?.period}</p>
                            <p className="text-sm text-primary">
                              {payload[0]?.value} publicações
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0]?.payload?.views?.toLocaleString('pt-BR')} views
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
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

      {/* Second row - Views charts */}
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
    </div>
  );
};