import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Activity, Search, ChevronLeft, ChevronRight, FileText, Trash2, Edit, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: unknown;
  created_at: string;
}

interface LogDetails {
  user_name?: string;
  old_title?: string;
  new_title?: string;
}

const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created: { label: 'Criou', color: 'bg-green-100 text-green-800', icon: <Plus className="h-3 w-3" /> },
  updated: { label: 'Editou', color: 'bg-blue-100 text-blue-800', icon: <Edit className="h-3 w-3" /> },
  published: { label: 'Publicou', color: 'bg-purple-100 text-purple-800', icon: <Send className="h-3 w-3" /> },
  deleted: { label: 'Excluiu', color: 'bg-red-100 text-red-800', icon: <Trash2 className="h-3 w-3" /> },
};

const entityLabels: Record<string, string> = {
  news: 'Notícia',
  category: 'Categoria',
  tag: 'Tag',
  comment: 'Comentário',
};

export const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (error) {
      console.error('Error fetching activity logs:', error);
    } else {
      setLogs(data || []);
    }
    
    setIsLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const details = log.details as LogDetails | null;
    const matchesSearch = searchQuery === '' 
      || (log.entity_title && log.entity_title.toLowerCase().includes(searchQuery.toLowerCase()))
      || (details?.user_name && details.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou usuário..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as ações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="created">Criações</SelectItem>
              <SelectItem value="updated">Edições</SelectItem>
              <SelectItem value="published">Publicações</SelectItem>
              <SelectItem value="deleted">Exclusões</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {logs.length === 0 ? 'Nenhuma atividade registrada ainda.' : 'Nenhuma atividade encontrada com esses filtros.'}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'atividade' : 'atividades'} encontradas
            </p>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-3 w-3" /> };
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {(log.details as LogDetails | null)?.user_name || 'Sistema'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionInfo.color} flex items-center gap-1 w-fit`}>
                            {actionInfo.icon}
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entityLabels[log.entity_type] || log.entity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={log.entity_title || '-'}>
                          {log.entity_title || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredLogs.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
