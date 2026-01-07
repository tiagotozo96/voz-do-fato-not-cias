import { useState, useEffect, useRef } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, FileJson, FileSpreadsheet, Database, Tag, FolderOpen, Newspaper, Mail, Clock, Trash2, RefreshCw, Calendar, Upload, RotateCcw, AlertTriangle, History, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupFile {
  name: string;
  created_at: string | null;
  metadata: Record<string, any> | null;
}

interface RestorationHistoryItem {
  id: string;
  restored_by: string | null;
  restored_at: string;
  backup_filename: string | null;
  backup_date: string | null;
  options: any;
  results: any;
  status: string;
  error_message: string | null;
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

  // Restore state
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<any>(null);
  const [backupFilename, setBackupFilename] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    restoreNews: true,
    restoreCategories: true,
    restoreTags: true,
    restoreSubscribers: false,
    clearExisting: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restoration history state
  const [restorationHistory, setRestorationHistory] = useState<RestorationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchSavedBackups();
    fetchRestorationHistory();
  }, []);

  const fetchRestorationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('restoration_history')
        .select('*')
        .order('restored_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRestorationHistory(data || []);
    } catch (error: any) {
      console.error('Error fetching restoration history:', error);
    }
    setIsLoadingHistory(false);
  };

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

  // Restore functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        setBackupToRestore(backup);
        setIsRestoreDialogOpen(true);
      } catch (error) {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'O arquivo não é um JSON válido.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const restoreFromSavedBackup = async (filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filename);

      if (error) throw error;

      const text = await data.text();
      const backup = JSON.parse(text);
      setBackupToRestore(backup);
      setBackupFilename(filename);
      setIsRestoreDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar backup',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleRestoreOption = (key: keyof typeof restoreOptions) => {
    setRestoreOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmRestore = () => {
    setIsRestoreDialogOpen(false);
    setIsConfirmRestoreOpen(true);
  };

  const executeRestore = async () => {
    setIsConfirmRestoreOpen(false);
    setIsRestoring(true);

    try {
      const { data, error } = await supabase.functions.invoke('restore-backup', {
        body: {
          backup: backupToRestore,
          options: restoreOptions,
          backupFilename: backupFilename,
        },
      });

      if (error) throw error;

      const results = data.results;
      const summary = [];
      if (results.categories?.restored > 0) summary.push(`${results.categories.restored} categorias`);
      if (results.tags?.restored > 0) summary.push(`${results.tags.restored} tags`);
      if (results.news?.restored > 0) summary.push(`${results.news.restored} notícias`);
      if (results.subscribers?.restored > 0) summary.push(`${results.subscribers.restored} assinantes`);

      toast({
        title: 'Restauração concluída!',
        description: summary.length > 0 ? `Restaurados: ${summary.join(', ')}.` : 'Nenhum dado foi restaurado.',
      });

      // Refresh history
      fetchRestorationHistory();
    } catch (error: any) {
      toast({
        title: 'Erro ao restaurar',
        description: error.message,
        variant: 'destructive',
      });
      fetchRestorationHistory();
    }

    setIsRestoring(false);
    setBackupToRestore(null);
    setBackupFilename(null);
  };

  const getResultsSummary = (results: any) => {
    if (!results || typeof results !== 'object') return 'Nenhum';
    const parts = [];
    if (results.categories?.restored) parts.push(`${results.categories.restored} cat.`);
    if (results.tags?.restored) parts.push(`${results.tags.restored} tags`);
    if (results.news?.restored) parts.push(`${results.news.restored} not.`);
    if (results.subscribers?.restored) parts.push(`${results.subscribers.restored} assin.`);
    return parts.join(', ') || 'Nenhum';
  };

  const exportRestorationHistoryCSV = () => {
    if (restorationHistory.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'O histórico de restaurações está vazio.',
        variant: 'destructive',
      });
      return;
    }

    const csvData = restorationHistory.map(item => ({
      data_restauracao: format(new Date(item.restored_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      status: item.status === 'success' ? 'Sucesso' : 'Falha',
      arquivo_backup: item.backup_filename || 'Arquivo local',
      data_backup: item.backup_date ? format(new Date(item.backup_date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : '-',
      noticias: item.options?.restoreNews ? 'Sim' : 'Não',
      categorias: item.options?.restoreCategories ? 'Sim' : 'Não',
      tags: item.options?.restoreTags ? 'Sim' : 'Não',
      assinantes: item.options?.restoreSubscribers ? 'Sim' : 'Não',
      limpeza_dados: item.options?.clearExisting ? 'Sim' : 'Não',
      noticias_restauradas: item.results?.news?.restored || 0,
      categorias_restauradas: item.results?.categories?.restored || 0,
      tags_restauradas: item.results?.tags?.restored || 0,
      assinantes_restaurados: item.results?.subscribers?.restored || 0,
      erro: item.error_message || '',
    }));

    const filename = `historico-restauracoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csvData, filename);

    toast({
      title: 'Histórico exportado!',
      description: `${restorationHistory.length} registros exportados para CSV.`,
    });
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
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => restoreFromSavedBackup(backup.name)}
                        title="Restaurar"
                      >
                        <RotateCcw className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadSavedBackup(backup.name)}
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSavedBackup(backup.name)}
                        title="Excluir"
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

      {/* Restore and History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-600" />
            Restauração de Backup
          </CardTitle>
          <CardDescription>
            Restaure dados a partir de um arquivo de backup ou veja o histórico de restaurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="restore" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="restore" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Restaurar
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="restore" className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRestoring}
                className="w-full"
              >
                {isRestoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isRestoring ? 'Restaurando...' : 'Selecionar Arquivo de Backup'}
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : restorationHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma restauração realizada ainda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {restorationHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        item.status === 'success' 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(item.restored_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {item.backup_filename && (
                              <p className="text-xs text-muted-foreground">{item.backup_filename}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={item.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {item.status === 'success' ? 'Sucesso' : 'Falha'}
                        </Badge>
                      </div>
                      
                      {item.status === 'success' && item.results && (
                        <p className="text-xs text-muted-foreground mt-2 ml-7">
                          Restaurados: {getResultsSummary(item.results)}
                        </p>
                      )}
                      
                      {item.status === 'failed' && item.error_message && (
                        <p className="text-xs text-red-600 mt-2 ml-7">
                          Erro: {item.error_message}
                        </p>
                      )}

                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-7">
                          {item.options.restoreNews && <Badge variant="outline" className="text-xs">Notícias</Badge>}
                          {item.options.restoreCategories && <Badge variant="outline" className="text-xs">Categorias</Badge>}
                          {item.options.restoreTags && <Badge variant="outline" className="text-xs">Tags</Badge>}
                          {item.options.restoreSubscribers && <Badge variant="outline" className="text-xs">Assinantes</Badge>}
                          {item.options.clearExisting && <Badge variant="destructive" className="text-xs">Limpeza</Badge>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={fetchRestorationHistory}
                  disabled={isLoadingHistory}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={exportRestorationHistoryCSV}
                  disabled={restorationHistory.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Restore Options Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              Restaurar Backup
            </DialogTitle>
            <DialogDescription>
              Selecione quais dados deseja restaurar do backup.
            </DialogDescription>
          </DialogHeader>

          {backupToRestore && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Data do backup:</strong> {backupToRestore.exportedAt ? format(new Date(backupToRestore.exportedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informada'}</p>
                {backupToRestore.stats && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>📰 {backupToRestore.stats.newsCount || backupToRestore.news?.length || 0} notícias</span>
                    <span>📁 {backupToRestore.stats.categoriesCount || backupToRestore.categories?.length || 0} categorias</span>
                    <span>🏷️ {backupToRestore.stats.tagsCount || backupToRestore.tags?.length || 0} tags</span>
                    <span>📧 {backupToRestore.stats.subscribersCount || backupToRestore.subscribers?.length || 0} assinantes</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restoreNews"
                    checked={restoreOptions.restoreNews}
                    onCheckedChange={() => toggleRestoreOption('restoreNews')}
                    disabled={!backupToRestore.news?.length}
                  />
                  <Label htmlFor="restoreNews" className="flex items-center gap-2 cursor-pointer">
                    <Newspaper className="h-4 w-4" />
                    Notícias ({backupToRestore.news?.length || 0})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restoreCategories"
                    checked={restoreOptions.restoreCategories}
                    onCheckedChange={() => toggleRestoreOption('restoreCategories')}
                    disabled={!backupToRestore.categories?.length}
                  />
                  <Label htmlFor="restoreCategories" className="flex items-center gap-2 cursor-pointer">
                    <FolderOpen className="h-4 w-4" />
                    Categorias ({backupToRestore.categories?.length || 0})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restoreTags"
                    checked={restoreOptions.restoreTags}
                    onCheckedChange={() => toggleRestoreOption('restoreTags')}
                    disabled={!backupToRestore.tags?.length}
                  />
                  <Label htmlFor="restoreTags" className="flex items-center gap-2 cursor-pointer">
                    <Tag className="h-4 w-4" />
                    Tags ({backupToRestore.tags?.length || 0})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restoreSubscribers"
                    checked={restoreOptions.restoreSubscribers}
                    onCheckedChange={() => toggleRestoreOption('restoreSubscribers')}
                    disabled={!backupToRestore.subscribers?.length}
                  />
                  <Label htmlFor="restoreSubscribers" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Assinantes ({backupToRestore.subscribers?.length || 0})
                  </Label>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="clearExisting"
                      checked={restoreOptions.clearExisting}
                      onCheckedChange={() => toggleRestoreOption('clearExisting')}
                    />
                    <Label htmlFor="clearExisting" className="flex items-center gap-2 cursor-pointer text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Limpar dados existentes antes de restaurar
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRestore}
              disabled={!Object.entries(restoreOptions).filter(([k]) => k.startsWith('restore')).some(([, v]) => v)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Restore Alert */}
      <AlertDialog open={isConfirmRestoreOpen} onOpenChange={setIsConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirmar Restauração
            </AlertDialogTitle>
            <AlertDialogDescription>
              {restoreOptions.clearExisting ? (
                <span className="text-destructive font-semibold">
                  ATENÇÃO: Todos os dados existentes selecionados serão EXCLUÍDOS e substituídos pelos dados do backup. Esta ação não pode ser desfeita!
                </span>
              ) : (
                'Os dados do backup serão adicionados/atualizados. Registros existentes com o mesmo ID serão sobrescritos.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeRestore} className={restoreOptions.clearExisting ? 'bg-destructive hover:bg-destructive/90' : ''}>
              {restoreOptions.clearExisting ? 'Sim, excluir e restaurar' : 'Confirmar restauração'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
