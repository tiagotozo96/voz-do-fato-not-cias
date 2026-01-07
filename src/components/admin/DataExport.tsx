import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Download, FileJson, FileSpreadsheet, Database, Tag, FolderOpen, Newspaper, Mail, Clock, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupFile {
  name: string;
  created_at: string | null;
  metadata: Record<string, any> | null;
}

export const DataExport = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [savedBackups, setSavedBackups] = useState<BackupFile[]>([]);
  const [exportOptions, setExportOptions] = useState({
    news: true,
    categories: true,
    tags: true,
    subscribers: false,
  });

  useEffect(() => {
    fetchSavedBackups();
  }, []);

  const fetchSavedBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;
      setSavedBackups(data || []);
    } catch (error: any) {
      console.error('Error fetching backups:', error);
    }
    setIsLoadingBackups(false);
  };

  const runScheduledBackupNow = async () => {
    setIsRunningBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-backup');
      
      if (error) throw error;

      toast({
        title: 'Backup executado!',
        description: data?.filename ? `Arquivo ${data.filename} criado.` : 'Backup concluído com sucesso.',
      });
      fetchSavedBackups();
    } catch (error: any) {
      toast({
        title: 'Erro ao executar backup',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsRunningBackup(false);
  };

  const downloadSavedBackup = async (filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filename);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Backup baixado!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao baixar backup',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteSavedBackup = async (filename: string) => {
    if (!confirm('Tem certeza que deseja excluir este backup?')) return;

    try {
      const { error } = await supabase.storage
        .from('backups')
        .remove([filename]);

      if (error) throw error;

      toast({ title: 'Backup excluído!' });
      fetchSavedBackups();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir backup',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleOption = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFullBackup = async () => {
    setIsExporting(true);
    try {
      const backup: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      if (exportOptions.news) {
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*, categories(*)')
          .order('created_at', { ascending: false });
        
        if (newsError) throw newsError;

        // Fetch tags for each news
        const { data: newsTags } = await supabase
          .from('news_tags')
          .select('news_id, tags(*)');

        const newsWithTags = (newsData || []).map(n => ({
          ...n,
          tags: (newsTags || [])
            .filter(nt => nt.news_id === n.id)
            .map(nt => nt.tags)
        }));

        backup.news = newsWithTags;
      }

      if (exportOptions.categories) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        backup.categories = categoriesData;
      }

      if (exportOptions.tags) {
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .order('name');
        
        if (tagsError) throw tagsError;
        backup.tags = tagsData;
      }

      if (exportOptions.subscribers) {
        const { data: subscribersData, error: subscribersError } = await supabase
          .from('newsletter_subscribers')
          .select('id, email, name, is_active, is_confirmed, subscribed_at')
          .order('subscribed_at', { ascending: false });
        
        if (subscribersError) throw subscribersError;
        backup.subscribers = subscribersData;
      }

      const filename = `backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      downloadJSON(backup, filename);

      toast({
        title: 'Backup exportado!',
        description: `Arquivo ${filename} baixado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const exportNewsOnly = async () => {
    setIsExporting(true);
    try {
      const { data: newsData, error } = await supabase
        .from('news')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const { data: newsTags } = await supabase
        .from('news_tags')
        .select('news_id, tags(*)');

      const newsWithTags = (newsData || []).map(n => ({
        ...n,
        tags: (newsTags || [])
          .filter(nt => nt.news_id === n.id)
          .map(nt => nt.tags)
      }));

      const filename = `noticias-${format(new Date(), 'yyyy-MM-dd')}.json`;
      downloadJSON(newsWithTags, filename);

      toast({
        title: 'Notícias exportadas!',
        description: `${newsWithTags.length} notícias exportadas.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  const exportSubscribersCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, name, is_active, is_confirmed, subscribed_at')
        .eq('is_active', true)
        .eq('is_confirmed', true)
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;

      const filename = `assinantes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      downloadCSV(data || [], filename);

      toast({
        title: 'Assinantes exportados!',
        description: `${data?.length || 0} assinantes exportados para CSV.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Full Backup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Backup Completo
          </CardTitle>
          <CardDescription>
            Exporte todos os dados do site em um único arquivo JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="news" 
                checked={exportOptions.news}
                onCheckedChange={() => toggleOption('news')}
              />
              <Label htmlFor="news" className="flex items-center gap-2 cursor-pointer">
                <Newspaper className="h-4 w-4" />
                Notícias
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="categories" 
                checked={exportOptions.categories}
                onCheckedChange={() => toggleOption('categories')}
              />
              <Label htmlFor="categories" className="flex items-center gap-2 cursor-pointer">
                <FolderOpen className="h-4 w-4" />
                Categorias
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="tags" 
                checked={exportOptions.tags}
                onCheckedChange={() => toggleOption('tags')}
              />
              <Label htmlFor="tags" className="flex items-center gap-2 cursor-pointer">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="subscribers" 
                checked={exportOptions.subscribers}
                onCheckedChange={() => toggleOption('subscribers')}
              />
              <Label htmlFor="subscribers" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Assinantes
              </Label>
            </div>
          </div>
          <Button 
            onClick={exportFullBackup} 
            disabled={isExporting || !Object.values(exportOptions).some(v => v)}
            className="w-full md:w-auto"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar Backup JSON
          </Button>
        </CardContent>
      </Card>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="h-5 w-5 text-blue-600" />
              Exportar Notícias
            </CardTitle>
            <CardDescription>
              Baixe todas as notícias com categorias e tags em JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={exportNewsOnly} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Baixar Notícias (JSON)
            </Button>
          </CardContent>
        </Card>

        {/* Export Subscribers CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Exportar Assinantes
            </CardTitle>
            <CardDescription>
              Baixe a lista de assinantes ativos da newsletter em CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={exportSubscribersCSV} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Baixar Assinantes (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Backups Automáticos
              </CardTitle>
              <CardDescription>
                Backups semanais são executados automaticamente todo domingo às 3h
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchSavedBackups}
                disabled={isLoadingBackups}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                size="sm"
                onClick={runScheduledBackupNow}
                disabled={isRunningBackup}
              >
                {isRunningBackup ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-1" />
                )}
                Executar Agora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum backup automático encontrado.</p>
              <p className="text-sm">Clique em "Executar Agora" para criar o primeiro backup.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedBackups.map((backup) => (
                  <TableRow key={backup.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-600" />
                        {backup.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backup.created_at ? format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {backup.metadata?.size ? formatFileSize(backup.metadata.size) : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadSavedBackup(backup.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSavedBackup(backup.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
